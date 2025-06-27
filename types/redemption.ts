export type Redemption = {
  id: string;
  beneficiary_id: string;
  product_id?: string | null;
  order_id: string;
  points_used: number;
  quantity: number;
  redemption_date: string;
};
