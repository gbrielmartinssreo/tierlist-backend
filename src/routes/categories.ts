import { FastifyInstance } from 'fastify';
import { createCategorySchema, updateCategorySchema, categoryParamsSchema, reorderCategoriesSchema } from '../utils/validation';
import { createCategory, updateCategory, deleteCategory, reorderCategories } from '../services/category';
import { authenticate, requireOwnership } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export async function categoryRoutes(app: FastifyInstance) {
  app.post('/tier-lists/:id/categories', { preHandler: authenticate, schema: createCategorySchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!requireOwnership(request, reply, id)) return;
    const { name, color } = request.body as { name: string; color: string };
    const result = await createCategory(id, request.user!.id, request.user!.name, { name, color });
    if (!result) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return result;
  });

  app.patch('/categories/:id', { preHandler: authenticate, schema: updateCategorySchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id }, include: { tierList: true } });
    if (!category || !requireOwnership(request, reply, category.tierListId)) return;
    const data = request.body as any;
    const result = await updateCategory(id, request.user!.id, request.user!.name, data);
    if (!result) return reply.code(404).send({ error: 'Categoria não encontrada' });
    return result;
  });

  app.delete('/categories/:id', { preHandler: authenticate, schema: categoryParamsSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const category = await prisma.category.findUnique({ where: { id }, include: { tierList: true } });
    if (!category || !requireOwnership(request, reply, category.tierListId)) return;
    const result = await deleteCategory(id, request.user!.id, request.user!.name);
    if (!result) return reply.code(404).send({ error: 'Categoria não encontrada' });
    return result;
  });

  app.post('/tier-lists/:id/categories/reorder', { preHandler: authenticate, schema: reorderCategoriesSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!requireOwnership(request, reply, id)) return;
    const { categoryIds } = request.body as { categoryIds: string[] };
    const result = await reorderCategories(id, request.user!.id, request.user!.name, categoryIds);
    if (!result) return reply.code(404).send({ error: 'Tier List não encontrada' });
    return result;
  });
}
