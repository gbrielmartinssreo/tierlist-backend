import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "TierList API",
        description: "API para gerenciamento de Tier Lists colaborativas",
        version: "1.0.0",
      },
      servers: [
        { url: "http://localhost:3001", description: "Desenvolvimento" },
        {
          url: "https://tierlist-backend.herokuapp.com",
          description: "Produção",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          cookieAuth: { type: "apiKey", in: "cookie", name: "refreshToken" },
        },
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
            },
          },
          TierList: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              userId: { type: "string" },
              userName: { type: "string" },
              themeImage: { type: "string", nullable: true },
              isPublic: { type: "boolean" },
              favorite: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              categories: {
                type: "array",
                items: { $ref: "#/components/schemas/Category" },
              },
              items: {
                type: "array",
                items: { $ref: "#/components/schemas/Item" },
              },
              activities: {
                type: "array",
                items: { $ref: "#/components/schemas/Activity" },
              },
            },
          },
          Category: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              color: { type: "string" },
              order: { type: "integer" },
            },
          },
          Item: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              imageUrl: { type: "string", nullable: true },
              categoryId: { type: "string" },
            },
          },
          Activity: {
            type: "object",
            properties: {
              id: { type: "string" },
              userId: { type: "string" },
              userName: { type: "string" },
              action: { type: "string" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
          Error: {
            type: "object",
            properties: {
              error: { type: "string" },
              details: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
  });
});
