export type PurchasableItem = {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  default_price: string;
  points_rule_id: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  } | null;
  points_rule?: {
    id: number;
    name: string;
  } | null;
};

export type CreatePurchasableItemInput = {
  name: string;
  description?: string;
  category_id?: number;
  default_price: number;
  points_rule_id?: number;
  active?: boolean;
};

export type UpdatePurchasableItemInput = Partial<CreatePurchasableItemInput>;
