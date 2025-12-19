import type { Redemption } from './redemption';
import type { Stock } from './stock';
import type { Category } from './category';

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  required_points: number;
  active: boolean;
  creation_date: string;
};

export type ProductWithRelations = Product & {
  category?: Category;
  stock?: Stock[];
  redemptions?: Redemption[];
};
