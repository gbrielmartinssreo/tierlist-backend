import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { UserPayload } from '../types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
    tokenPayload?: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractTokenFromHeader(request.headers.authorization);
  if (!token) {
    return reply.code(401).send({ error: 'Token de acesso requerido' });
  }

  const payload = await verifyToken(token, 'access');
  if (!payload) {
    return reply.code(401).send({ error: 'Token inválido ou expirado' });
  }

  request.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
  };
  request.tokenPayload = payload;
}

export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractTokenFromHeader(request.headers.authorization);
  if (!token) return;

  const payload = await verifyToken(token, 'access');
  if (payload) {
    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    request.tokenPayload = payload;
  }
}

export function requireOwnership(
  request: FastifyRequest,
  reply: FastifyReply,
  resourceUserId: string
): boolean {
  if (!request.user) {
    reply.code(401).send({ error: 'Não autenticado' });
    return false;
  }
  if (request.user.id !== resourceUserId) {
    reply.code(403).send({ error: 'Acesso negado: você não é o proprietário' });
    return false;
  }
  return true;
}