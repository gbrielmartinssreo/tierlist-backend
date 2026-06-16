import { FastifyInstance } from 'fastify';
import { createTierListSchema, updateTierListSchema, tierListParamsSchema, listQuerySchema } from '../utils/validation';
import { createTierList, getTierLists, getTierListById, updateTierList, deleteTierList, saveTierList } from '../services/tierList';
import { authenticate, optionalAuth } from '../middleware/auth';

export async function tierListRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: optionalAuth, schema: listQuerySchema }, async (request) => {
    const rawQuery = request.query as Record<string, string | undefined>;
    const query = {
      page: parseInt(rawQuery.page || '1', 10),
      pageSize: parseInt(rawQuery.pageSize || '20', 10),
      search: rawQuery.search,
      favorite: rawQuery.favorite === 'true',
      author: rawQuery.author as 'all' | 'me' | undefined,
      sortBy: (rawQuery.sortBy as 'updated' | 'created' | 'alphabetical' | 'items') || 'updated',
    };
    const userId = request.user?.id || '';
    return getTierLists(userId, query);
  });

  app.post('/', { preHandler: authenticate, schema: createTierListSchema }, async (request) => {
    const { name, themeImage, categories } = request.body as any;
    return createTierList(request.user!.id, request.user!.name, { name, themeImage, categories });
  });

  app.get('/:id', { preHandler: optionalAuth, schema: tierListParamsSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tierList = await getTierListById(id, request.user?.id);
    if (!tierList) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return tierList;
  });

  app.patch('/:id', { preHandler: authenticate, schema: updateTierListSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const updated = await updateTierList(id, request.user!.id, data);
    if (!updated) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return updated;
  });

  app.delete('/:id', { preHandler: authenticate, schema: tierListParamsSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await deleteTierList(id, request.user!.id);
    if (!deleted) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return { success: true };
  });

  app.put('/:id/save', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, themeImage, categories } = request.body as any;
    const result = await saveTierList(id, request.user!.id, request.user!.name, { name, themeImage, categories });
    if (!result) return reply.code(404).send({ error: 'Tier List não encontrada ou acesso negado' });
    return result;
  });
}
