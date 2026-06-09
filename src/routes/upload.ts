import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { uploadImage, uploadThemeImage } from '../utils/cloudinary';

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload/image', { preHandler: authenticate }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'Nenhum arquivo enviado' });

    const buffer = await data.toBuffer();
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.code(400).send({ error: 'Arquivo muito grande (máx 5MB)' });
    }

    const result = await uploadImage(buffer, 'tierlist/items');
    return { url: result.url, publicId: result.publicId };
  });

  app.post('/upload/theme', { preHandler: authenticate }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'Nenhum arquivo enviado' });

    const buffer = await data.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return reply.code(400).send({ error: 'Arquivo muito grande (máx 10MB)' });
    }

    const result = await uploadThemeImage(buffer);
    return { url: result.url, publicId: result.publicId };
  });
}
