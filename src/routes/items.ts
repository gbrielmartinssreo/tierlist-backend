import { FastifyInstance } from 'fastify';
import { createItemSchema, updateItemSchema, itemParamsSchema, reorderItemsSchema } from '../utils/validation';
import { createItem, updateItem, deleteItem, reorderItems } from '../services/item';
import { authenticate, requireOwnership } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export async function itemRoutes(app: FastifyInstance) {
  app.post('/tier-lists/:id/items', { preHandler: authenticate, schema: createItemSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!requireOwnership(request, reply, id)) return;
    const { name, categoryId, imageUrl } = request.body as any;
    const result = await createItem(id, request.user!.id, request.user!.name, { name, categoryId, imageUrl });
    if (!result) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return result;
  });

  app.patch('/items/:id', { preHandler: authenticate, schema: updateItemSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.tierItem.findUnique({ where: { id }, include: { tierList: true } });
    if (!item || !requireOwnership(request, reply, item.tierListId)) return;
    const data = request.body as any;
    const result = await updateItem(id, request.user!.id, request.user!.name, data);
    if (!result) return reply.code(404).send({ error: 'Item não encontrado' });
    return result;
  });

  app.delete('/items/:id', { preHandler: authenticate, schema: itemParamsSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.tierItem.findUnique({ where: { id }, include: { tierList: true } });
    if (!item || !requireOwnership(request, reply, item.tierListId)) return;
    const result = await deleteItem(id, request.user!.id, request.user!.name);
    if (!result) return reply.code(404).send({ error: 'Item não encontrado' });
    return result;
  });

  app.post('/tier-lists/:id/items/reorder', { preHandler: authenticate, schema: reorderItemsSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!requireOwnership(request, reply, id)) return;
    const data = request.body as any;
    const result = await reorderItems(id, request.user!.id, request.user!.name, data);
    if (!result) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return result;
  });
}
