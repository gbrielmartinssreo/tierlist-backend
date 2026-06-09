import { prisma } from "../utils/prisma";
import { TierListResponse } from "../types";

const POOL_ID = "__POOL__";

export async function createItem(
  tierListId: string,
  userId: string,
  userName: string,
  data: { name: string; categoryId: string; imageUrl?: string },
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({
    where: { id: tierListId },
  });
  if (!tierList || tierList.userId !== userId) return null;

  await prisma.$transaction(async (tx: any) => {
    await tx.tierItem.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        tierListId,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        userName,
        action: `adicionou item "${data.name}"`,
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

export async function updateItem(
  itemId: string,
  userId: string,
  userName: string,
  data: { name?: string; imageUrl?: string | null; categoryId?: string },
): Promise<TierListResponse | null> {
  const item = await prisma.tierItem.findUnique({
    where: { id: itemId },
    include: { tierList: true },
  });
  if (!item || item.tierList.userId !== userId) return null;

  const oldName = item.name;
  const oldCategoryId = item.categoryId;

  await prisma.$transaction(async (tx: any) => {
    await tx.tierItem.update({ where: { id: itemId }, data });

    if (data.name && data.name !== oldName) {
      await tx.activityLog.create({
        data: {
          userId,
          userName,
          action: `renomeou item de "${oldName}" para "${data.name}"`,
          tierListId: item.tierListId,
        },
      });
    }
    if (data.categoryId && data.categoryId !== oldCategoryId) {
      const newCat = await tx.category.findUnique({
        where: { id: data.categoryId },
        select: { name: true },
      });
      const oldCat = await tx.category.findUnique({
        where: { id: oldCategoryId },
        select: { name: true },
      });
      if (newCat && oldCat) {
        await tx.activityLog.create({
          data: {
            userId,
            userName,
            action: `moveu "${data.name || oldName}" para categoria "${newCat.name}"`,
            tierListId: item.tierListId,
          },
        });
      }
    }

    await tx.tierList.update({
      where: { id: item.tierListId },
      data: { updatedAt: new Date() },
    });
  });

  return getTierListById(item.tierListId, userId);
}

export async function deleteItem(
  itemId: string,
  userId: string,
  userName: string,
): Promise<TierListResponse | null> {
  const item = await prisma.tierItem.findUnique({
    where: { id: itemId },
    include: { tierList: true },
  });
  if (!item || item.tierList.userId !== userId) return null;

  await prisma.$transaction(async (tx: any) => {
    await tx.tierItem.delete({ where: { id: itemId } });
    await tx.activityLog.create({
      data: {
        userId,
        userName,
        action: `removeu item "${item.name}"`,
        tierListId: item.tierListId,
      },
    });
    await tx.tierList.update({
      where: { id: item.tierListId },
      data: { updatedAt: new Date() },
    });
  });

  return getTierListById(item.tierListId, userId);
}

export async function reorderItems(
  tierListId: string,
  userId: string,
  userName: string,
  data: {
    itemId: string;
    sourceCategoryId: string;
    destinationCategoryId: string;
    destinationIndex: number;
  },
): Promise<TierListResponse | null> {
  const tierList = await prisma.tierList.findUnique({
    where: { id: tierListId },
  });
  if (!tierList || tierList.userId !== userId) return null;

  const item = await prisma.tierItem.findUnique({ where: { id: data.itemId } });
  if (!item || item.tierListId !== tierListId) return null;

  await prisma.$transaction(async (tx: any) => {
    // Remove from source
    const sourceItems = await tx.tierItem.findMany({
      where: { categoryId: data.sourceCategoryId, tierListId },
      orderBy: { createdAt: "asc" },
    });
    const sourceIndex = sourceItems.findIndex((i: any) => i.id === data.itemId);
    if (sourceIndex === -1) throw new Error("ITEM_NOT_IN_SOURCE");

    // Get destination items
    const destItems = await tx.tierItem.findMany({
      where: { categoryId: data.destinationCategoryId, tierListId },
      orderBy: { createdAt: "asc" },
    });

    // Insert at destinationIndex
    const newOrder = [...destItems];
    newOrder.splice(data.destinationIndex, 0, item);

    // Update all items with new createdAt to reflect order (or use a dedicated order field)
    for (let i: any = 0; i < newOrder.length; i++) {
      await tx.tierItem.update({
        where: { id: newOrder[i].id },
        data: { createdAt: new Date(Date.now() + i) }, // hack for ordering
      });
    }

    // Update item's category
    await tx.tierItem.update({
      where: { id: data.itemId },
      data: { categoryId: data.destinationCategoryId },
    });

    const newCat = await tx.category.findUnique({
      where: { id: data.destinationCategoryId },
      select: { name: true },
    });
    const action =
      newCat && data.destinationCategoryId !== POOL_ID
        ? `moveu "${item.name}" para categoria "${newCat.name}"`
        : `moveu "${item.name}" para o Banco de Itens`;

    await tx.activityLog.create({
      data: { userId, userName, action, tierListId },
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
