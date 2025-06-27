import type { Subcategory } from './subcategory';
import type { Stock } from './stock';
import type { Redemption } from './redemption';

export type Product = {
  id: string;
  subcategory_id: string;
  name: string;
  description?: string | null;
  required_points: number;
  active: boolean;
  creation_date: string;
};

export type ProductWithRelations = Product & {
  subcategory?: Subcategory;
  stock?: Stock[];
  redemptions?: Redemption[];
};
