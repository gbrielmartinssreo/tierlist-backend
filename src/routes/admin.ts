import { FastifyInstance } from 'fastify';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { requireAdmin } from '../middleware/adminAuth';
import { prisma } from '../utils/prisma';

function loadAdminHTML(): string {
  // Dev: tsx executa de src/; Prod: compilado em dist/
  const paths = [
    join(__dirname, '..', 'pages', 'admin.html'),
    join(__dirname, '..', '..', 'src', 'pages', 'admin.html'),
    join(process.cwd(), 'src', 'pages', 'admin.html'),
  ];
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, 'utf-8');
  }
  return '<html><body><h1>Admin page not found</h1></body></html>';
}

const ADMIN_HTML = loadAdminHTML();

export async function adminRoutes(app: FastifyInstance) {
  // Serve a página HTML do admin
  app.get('/', async (request, reply) => {
    const adminSession = request.cookies?.admin_session;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const decoded = adminSession
      ? Buffer.from(adminSession, 'base64').toString('utf-8')
      : '';
    const [storedEmail, storedPassword, expires] = decoded.split('|');
    const isLoggedIn =
      storedEmail === email &&
      storedPassword === password &&
      Date.now() < Number(expires);

    const html = ADMIN_HTML;
    const injected = html
      .replace('ADMIN_EMAIL_PLACEHOLDER', process.env.ADMIN_EMAIL || '')
      .replace(
        '</head>',
        `<script>window.__ADMIN_LOGGED_IN__ = ${isLoggedIn};</script></head>`
      );
    return reply.type('text/html').send(injected);
  });

  // Login
  app.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return reply.code(401).send({ error: 'Credenciais inválidas' });
    }

    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const session = Buffer.from(`${email}|${password}|${expires}`).toString('base64');

    reply.setCookie('admin_session', session, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60,
    });

    return { success: true };
  });

  // Logout
  app.post('/logout', async (request, reply) => {
    reply.clearCookie('admin_session', { path: '/' });
    return { success: true };
  });

  // Listar usuários (protegido)
  app.get('/api/users', { preHandler: requireAdmin }, async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { tierLists: true } },
      },
    });
    return { data: users };
  });

  // Deletar usuário (protegido)
  app.delete('/api/users/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' });
    if (user.email === process.env.ADMIN_EMAIL) {
      return reply.code(403).send({ error: 'Não é possível deletar o admin principal' });
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
  });

  // Listar tier lists de um usuário
  app.get('/api/users/:id/tierlists', { preHandler: requireAdmin }, async (request) => {
    const { id } = request.params as { id: string };
    const tierLists = await prisma.tierList.findMany({
      where: { userId: id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return { data: tierLists };
  });
}
