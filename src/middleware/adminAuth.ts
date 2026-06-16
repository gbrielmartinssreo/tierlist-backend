import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const adminSession = request.cookies?.admin_session;
  if (!adminSession) {
    return reply.code(401).send({ error: 'Acesso negado: faça login como admin' });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const decoded = Buffer.from(adminSession, 'base64').toString('utf-8');
  const [storedEmail, storedPassword, expires] = decoded.split('|');

  if (storedEmail !== email || storedPassword !== password || Date.now() > Number(expires)) {
    reply.clearCookie('admin_session', { path: '/' });
    return reply.code(401).send({ error: 'Sessão expirada ou inválida' });
  }
}
