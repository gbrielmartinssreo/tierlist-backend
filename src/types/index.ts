export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  type: 'access' | 'refresh';
  tokenId?: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface TierListResponse {
  id: string;
  name: string;
  userId: string;
  userName: string;
  themeImage: string | null;
  isPublic: boolean;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: CategoryResponse[];
  items: ItemResponse[];
  activities: ActivityResponse[];
}

export interface CategoryResponse {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface ItemResponse {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string;
}

export interface ActivityResponse {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTierListInput {
  name: string;
  themeImage?: string;
  categories: { name: string; color: string }[];
}

export interface UpdateTierListInput {
  name?: string;
  themeImage?: string | null;
  favorite?: boolean;
  isPublic?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  order?: number;
}

export interface CreateItemInput {
  name: string;
  categoryId: string;
  imageUrl?: string;
}

export interface UpdateItemInput {
  name?: string;
  imageUrl?: string | null;
  categoryId?: string;
}

export interface ReorderCategoriesInput {
  categoryIds: string[];
}

export interface ReorderItemsInput {
  itemId: string;
  sourceCategoryId: string;
  destinationCategoryId: string;
  destinationIndex: number;
}