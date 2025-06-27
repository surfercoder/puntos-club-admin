import type { Branch } from './branch';
import type { Product } from './product';

export type Stock = {
  id: string;
  branch_id: string;
  product_id: string;
  quantity: number;
  minimum_quantity: number;
  last_updated: string;
};

export type StockWithRelations = Stock & {
  branch?: Branch;
  product?: Product;
};
