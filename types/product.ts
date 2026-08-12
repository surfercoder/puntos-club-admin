import type { Category } from './category';

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  required_points: number;
  stock: number;

  creation_date: string;
  image_urls?: string[] | null;
};

export type ProductWithRelations = Product & {
  category?: Category;
};
