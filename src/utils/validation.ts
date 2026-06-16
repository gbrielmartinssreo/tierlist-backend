import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
  }),
});

export const createTierListSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    themeImage: z.string().refine(
      (val: string) => val.startsWith('data:image/') || /^https?:\/\/.+/.test(val),
      'Theme image deve ser uma URL válida ou data:image URL'
    ).nullable().optional(),
    categories: z.array(
      z.object({
        name: z.string().min(1).max(30),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal'),
      })
    ).min(1, 'Pelo menos uma categoria é obrigatória'),
  }),
});

export const updateTierListSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    themeImage: z.string().refine(
      (val: string) => val.startsWith('data:image/') || /^https?:\/\/.+/.test(val),
      'Theme image deve ser uma URL válida ou data:image URL'
    ).nullable().optional(),
    favorite: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const tierListParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(30),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(30).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    order: z.number().int().min(0).optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const createItemSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    categoryId: z.string().cuid(),
    imageUrl: z.string().url().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateItemSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    imageUrl: z.string().url().nullable().optional(),
    categoryId: z.string().cuid().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const itemParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const reorderCategoriesSchema = z.object({
  body: z.object({
    categoryIds: z.array(z.string().cuid()).min(1),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const reorderItemsSchema = z.object({
  body: z.object({
    itemId: z.string().cuid(),
    sourceCategoryId: z.string().cuid(),
    destinationCategoryId: z.string().cuid(),
    destinationIndex: z.number().int().min(0),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    search: z.string().optional(),
    favorite: z.coerce.boolean().optional(),
    author: z.enum(['all', 'me']).optional(),
    sortBy: z.enum(['updated', 'created', 'alphabetical', 'items']).default('updated'),
  }),
});

export const activitiesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});