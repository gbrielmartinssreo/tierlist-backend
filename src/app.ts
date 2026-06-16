import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import swaggerPlugin from './plugins/swagger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { tierListRoutes } from './routes/tierLists';
import { categoryRoutes } from './routes/categories';
import { itemRoutes } from './routes/items';
import { uploadRoutes } from './routes/upload';
import { activityRoutes } from './routes/activities';

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'change-me-in-production',
    hook: 'onRequest',
  });

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  await app.register(swaggerPlugin);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(tierListRoutes, { prefix: '/api/tier-lists' });
  await app.register(categoryRoutes, { prefix: '/api' });
  await app.register(itemRoutes, { prefix: '/api' });
  await app.register(uploadRoutes, { prefix: '/api' });
  await app.register(activityRoutes, { prefix: '/api' });

  return app;
}
