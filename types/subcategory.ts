import type { Category } from './category';
import type { Product } from './product';

export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type SubcategoryWithRelations = Subcategory & {
  category?: Category;
  products?: Product[];
};
