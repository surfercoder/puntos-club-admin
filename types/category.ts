import type { Subcategory } from './subcategory';

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type CategoryWithRelations = Category & {
  subcategories?: Subcategory[];
};
