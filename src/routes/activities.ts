import { FastifyInstance } from 'fastify';
import { activitiesQuerySchema } from '../utils/validation';
import { authenticate, optionalAuth, requireOwnership } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export async function activityRoutes(app: FastifyInstance) {
  app.get('/tier-lists/:id/activities', { preHandler: optionalAuth, schema: activitiesQuerySchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page, pageSize } = request.query as { page: number; pageSize: number };

    const tierList = await prisma.tierList.findUnique({ where: { id } });
    if (!tierList) return reply.code(404).send({ error: 'Tier List não encontrada' });
    if (!tierList.isPublic && tierList.userId !== request.user?.id) {
      return reply.code(403).send({ error: 'Acesso negado' });
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { tierListId: id },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.activityLog.count({ where: { tierListId: id } }),
    ]);

    return {
      data: activities,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
}
