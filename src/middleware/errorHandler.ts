import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  request.log.error(error);

  if (error instanceof ZodError) {
    const zodError = error as unknown as ZodError & { errors: any[] };
    return reply.code(400).send({
      error: "Dados inválidos",
      details: (zodError.errors || []).map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if ((error as any).validation) {
    return reply.code(400).send({
      error: "Dados inválidos",
      details: (error as any).validation,
    });
  }

  if (error.statusCode === 401) {
    return reply.code(401).send({ error: error.message || "Não autorizado" });
  }

  if (error.statusCode === 403) {
    return reply.code(403).send({ error: error.message || "Acesso negado" });
  }

  if (error.statusCode === 404) {
    return reply
      .code(404)
      .send({ error: error.message || "Recurso não encontrado" });
  }

  if (error.code === "P2003") {
    return reply
      .code(400)
      .send({ error: "Referência inválida: recurso relacionado não existe" });
  }

  if (error.code === "P2002") {
    return reply.code(409).send({ error: "Registro duplicado" });
  }

  return reply.code(500).send({ error: "Erro interno do servidor" });
}
