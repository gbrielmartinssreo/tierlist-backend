import { prisma } from "../utils/prisma";
import { TierListResponse } from "../types";

export async function createCategory(
  tierListId: string,
  userId: string,
  userName: string,
  data: { name: string; color: string },
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({
    where: { id: tierListId },
  });
  if (!tierList || tierList.userId !== userId) return null;

  const maxOrder = await prisma.category.findFirst({
    where: { tierListId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.$transaction(async (tx: any) => {
    await tx.category.create({
      data: {
        name: data.name,
        color: data.color,
        order: (maxOrder?.order ?? -1) + 1,
        tierListId,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        userName,
        action: `adicionou categoria "${data.name}"`,
        tierListId,
      },
    });

    await tx.tierList.update({
      where: { id: tierListId },
      data: { updatedAt: new Date() },
    });
  });

  return getTierListById(tierListId, userId);
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  userName: string,
  data: { name?: string; color?: string; order?: number },
): Promise<TierListResponse | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { tierList: true },
  });
  if (!category || category.tierList.userId !== userId) return null;

  const oldName = category.name;

  await prisma.$transaction(async (tx: any) => {
    await tx.category.update({
      where: { id: categoryId },
      data,
    });

    if (data.name && data.name !== oldName) {
      await tx.activityLog.create({
        data: {
          userId,
          userName,
          action: `renomeou categoria de "${oldName}" para "${data.name}"`,
          tierListId: category.tierListId,
        },
      });
    }

    await tx.tierList.update({
      where: { id: category.tierListId },
      data: { updatedAt: new Date() },
    });
  });

  return getTierListById(category.tierListId, userId);
}

export async function deleteCategory(
  categoryId: string,
  userId: string,
  userName: string,
): Promise<TierListResponse | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { tierList: true },
  });
  if (!category || category.tierList.userId !== userId) return null;

  await prisma.$transaction(async (tx: any) => {
    await tx.tierItem.updateMany({
      where: { categoryId },
      data: { categoryId: "__POOL__" },
    });

    await tx.category.delete({ where: { id: categoryId } });

    await tx.activityLog.create({
      data: {
        userId,
        userName,
        action: `removeu categoria "${category.name}"`,
        tierListId: category.tierListId,
      },
    });

    await tx.tierList.update({
      where: { id: category.tierListId },
      data: { updatedAt: new Date() },
    });

    await reorderCategoriesAfterDelete(tx, category.tierListId, category.order);
  });

  return getTierListById(category.tierListId, userId);
}

async function reorderCategoriesAfterDelete(
  tx: any,
  tierListId: string,
  deletedOrder: number,
): Promise<void> {
  const categories = await tx.category.findMany({
    where: { tierListId, order: { gt: deletedOrder } },
    orderBy: { order: "asc" },
  });

  for (const cat of categories) {
    await tx.category.update({
      where: { id: cat.id },
      data: { order: cat.order - 1 },
    });
  }
}

export async function reorderCategories(
  tierListId: string,
  userId: string,
  userName: string,
  categoryIds: string[],
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({
    where: { id: tierListId },
  });
  if (!tierList || tierList.userId !== userId) return null;

  await prisma.$transaction(async (tx: any) => {
    for (let i = 0; i < categoryIds.length; i++) {
      await tx.category.update({
        where: { id: categoryIds[i] },
        data: { order: i },
      });
    }

    const names = await Promise.all(
      categoryIds.map((id) =>
        tx.category.findUnique({ where: { id }, select: { name: true } }),
      ),
    );

    await tx.activityLog.create({
      data: {
        userId,
        userName,
        action: `reordenou categorias: ${names.map((n, idx) => n?.name || categoryIds[idx]).join(", ")}`,
        tierListId,
      },
    });

    await tx.tierList.update({
      where: { id: tierListId },
      data: { updatedAt: new Date() },
    });
  });

  return getTierListById(tierListId, userId);
}

async function getTierListById(
  id: string,
  userId?: string,
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({
    where: { id },
    include: {
      categories: { orderBy: { order: "asc" } },
      items: true,
      user: { select: { name: true } },
      activities: { orderBy: { timestamp: "desc" } },
    },
  });

  if (!tierList) return null;
  if (!tierList.isPublic && tierList.userId !== userId) return null;

  return {
    id: tierList.id,
    name: tierList.name,
    userId: tierList.userId,
    userName: tierList.user.name,
    themeImage: tierList.themeImage,
    isPublic: tierList.isPublic,
    favorite: tierList.favorite,
    createdAt: tierList.createdAt,
    updatedAt: tierList.updatedAt,
    categories: tierList.categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      order: c.order,
    })),
    items: tierList.items.map((i: any) => ({
      id: i.id,
      name: i.name,
      imageUrl: i.imageUrl,
      categoryId: i.categoryId,
    })),
    activities: tierList.activities.map((a: any) => ({
      id: a.id,
      userId: a.userId,
      userName: a.userName,
      action: a.action,
      timestamp: a.timestamp,
    })),
  };
}
