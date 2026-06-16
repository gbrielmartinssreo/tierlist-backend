import { prisma } from '../utils/prisma';
import { TierListResponse, PaginatedResponse } from '../types';
import { Prisma } from '@prisma/client';

export async function createTierList(
  userId: string,
  userName: string,
  data: { name: string; themeImage?: string; categories: { name: string; color: string }[] }
): Promise<TierListResponse> {
  const tierList = await prisma.tierList.create({
    data: {
      name: data.name,
      userId,
      themeImage: data.themeImage,
      categories: {
        create: data.categories.map((cat, index) => ({
          name: cat.name,
          color: cat.color,
          order: index,
        })),
      },
      activities: {
        create: {
          userId,
          userName,
          action: `Criou a Tier List "${data.name}"`,
        },
      },
    },
    include: {
      categories: { orderBy: { order: 'asc' } },
      items: true,
      user: { select: { name: true } },
      activities: { orderBy: { timestamp: 'desc' }, take: 20 },
    },
  });

  return formatTierListResponse(tierList, tierList.user.name);
}

export async function getTierLists(
  userId: string,
  options: {
    page: number;
    pageSize: number;
    search?: string;
    favorite?: boolean;
    author?: 'all' | 'me';
    sortBy: 'updated' | 'created' | 'alphabetical' | 'items';
  }
): Promise<PaginatedResponse<TierListResponse>> {
  const { page, pageSize, search, favorite, author, sortBy } = options;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (author === 'me') {
    where.userId = userId;
  } else {
    // Só mostra tier lists públicas de outros usuários
    where.isPublic = true;
  }
  if (favorite) where.favorite = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } },
      }
    ];
  }

  const orderBy = getOrderBy(sortBy);

  const [tierLists, total] = await Promise.all([
    prisma.tierList.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        categories: { orderBy: { order: 'asc' } },
        items: true,
        user: { select: { name: true } },
        activities: { orderBy: { timestamp: 'desc' }, take: 5 },
      },
    }),
    prisma.tierList.count({ where }),
  ]);

  return {
    data: tierLists.map((tl) => formatTierListResponse(tl, tl.user.name)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTierListById(
  id: string,
  userId?: string
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({
    where: { id },
    include: {
      categories: { orderBy: { order: 'asc' } },
      items: true,
      user: { select: { name: true } },
      activities: { orderBy: { timestamp: 'desc' } },
    },
  });

  if (!tierList) return null;

  if (!tierList.isPublic && tierList.userId !== userId) {
    return null;
  }

  return formatTierListResponse(tierList, tierList.user.name);
}

export async function updateTierList(
  id: string,
  userId: string,
  data: { name?: string; themeImage?: string | null; favorite?: boolean; isPublic?: boolean }
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({ where: { id } });
  if (!tierList || tierList.userId !== userId) return null;

  const updated = await prisma.tierList.update({
    where: { id },
    data,
    include: {
      categories: { orderBy: { order: 'asc' } },
      items: true,
      user: { select: { name: true } },
      activities: { orderBy: { timestamp: 'desc' }, take: 20 },
    },
  });

  return formatTierListResponse(updated, updated.user.name);
}

export async function deleteTierList(id: string, userId: string): Promise<{ success: true } | { error: 'NOT_FOUND' | 'FORBIDDEN' }> {
  const tierList = await prisma.tierList.findUnique({ where: { id } });
  if (!tierList) return { error: 'NOT_FOUND' };
  if (tierList.userId !== userId) return { error: 'FORBIDDEN' };

  await prisma.tierList.delete({ where: { id } });
  return { success: true };
}

export async function saveTierList(
  id: string,
  userId: string,
  userName: string,
  data: {
    name?: string;
    themeImage?: string | null;
    categories: { name: string; color: string; order: number; items: { name: string; imageUrl?: string | null }[] }[];
  }
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({ where: { id } });
  if (!tierList || tierList.userId !== userId) return null;

  const result = await prisma.$transaction(async (tx) => {
    // Delete all existing items and categories
    await tx.tierItem.deleteMany({ where: { tierListId: id } });
    await tx.category.deleteMany({ where: { tierListId: id } });

    // Re-create categories with items
    for (const cat of data.categories) {
      await tx.category.create({
        data: {
          name: cat.name,
          color: cat.color,
          order: cat.order,
          tierListId: id,
          items: {
            create: cat.items.map((item) => ({
              name: item.name,
              imageUrl: item.imageUrl || null,
              tierListId: id,
            })),
          },
        },
      });
    }

    // Update tier list metadata
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.themeImage !== undefined) updateData.themeImage = data.themeImage;

    const updated = await tx.tierList.update({
      where: { id },
      data: {
        ...updateData,
        activities: {
          create: {
            userId,
            userName,
            action: `Salvou a Tier List "${data.name || tierList.name}"`,
          },
        },
      },
      include: {
        categories: { orderBy: { order: 'asc' } },
        items: true,
        user: { select: { name: true } },
        activities: { orderBy: { timestamp: 'desc' }, take: 20 },
      },
    });

    return updated;
  });

  return formatTierListResponse(result, result.user.name);
}

function getOrderBy(sortBy: string): Prisma.TierListOrderByWithRelationInput {
  switch (sortBy) {
    case 'created':
      return { createdAt: 'desc' };
    case 'alphabetical':
      return { name: 'asc' };
    case 'items':
      return { items: { _count: 'desc' } };
    case 'updated':
    default:
      return { updatedAt: 'desc' };
  }
}

interface TierListWithRelations {
  id: string;
  name: string;
  userId: string;
  themeImage: string | null;
  isPublic: boolean;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: Array<{ id: string; name: string; color: string; order: number }>;
  items: Array<{ id: string; name: string; imageUrl: string | null; categoryId: string }>;
  activities: Array<{ id: string; userId: string; userName: string; action: string; timestamp: Date }>;
  user: { name: string };
}

function formatTierListResponse(tierList: TierListWithRelations, userName: string): TierListResponse {
  return {
    id: tierList.id,
    name: tierList.name,
    userId: tierList.userId,
    userName,
    themeImage: tierList.themeImage,
    isPublic: tierList.isPublic,
    favorite: tierList.favorite,
    createdAt: tierList.createdAt,
    updatedAt: tierList.updatedAt,
    categories: tierList.categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      order: c.order,
    })),
    items: tierList.items.map((i) => ({
      id: i.id,
      name: i.name,
      imageUrl: i.imageUrl,
      categoryId: i.categoryId,
    })),
    activities: tierList.activities.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.userName,
      action: a.action,
      timestamp: a.timestamp,
    })),
  };
}