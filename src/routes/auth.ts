import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema } from '../utils/validation';
import { registerUser, loginUser, refreshAccessToken, logoutUser, getUserById, updateUser } from '../services/auth';
import { authenticate } from '../middleware/auth';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', { schema: registerSchema }, async (request, reply) => {
    const { email, name, password } = request.body as { email: string; name: string; password: string };
    try {
      const { user, accessToken, refreshToken } = await registerUser(email, name, password);
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      return { user, accessToken };
    } catch (e) {
      if ((e as Error).message === 'EMAIL_EXISTS') {
        return reply.code(409).send({ error: 'Email já cadastrado' });
      }
      throw e;
    }
  });

  app.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    try {
      const { user, accessToken, refreshToken } = await loginUser(email, password);
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      return { user, accessToken };
    } catch (e) {
      if ((e as Error).message === 'INVALID_CREDENTIALS') {
        return reply.code(401).send({ error: 'Credenciais inválidas' });
      }
      throw e;
    }
  });

  app.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) return reply.code(401).send({ error: 'Refresh token não encontrado' });

    const tokens = await refreshAccessToken(refreshToken);
    if (!tokens) {
      reply.clearCookie('refreshToken', { path: '/' });
      return reply.code(401).send({ error: 'Refresh token inválido ou expirado' });
    }

    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { accessToken: tokens.accessToken };
  });

  app.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) await logoutUser(refreshToken);
    reply.clearCookie('refreshToken', { path: '/' });
    return { success: true };
  });

  app.get('/me', { preHandler: authenticate }, async (request) => {
    const user = await getUserById(request.user!.id);
    return { user };
  });

  app.patch('/me', { preHandler: authenticate }, async (request, reply) => {
    const { name, avatarUrl } = request.body as { name?: string; avatarUrl?: string | null };
    const user = await updateUser(request.user!.id, { name, avatarUrl });
    return { user };
  });
}
