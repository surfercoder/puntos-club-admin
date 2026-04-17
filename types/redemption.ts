export type Redemption = {
  id: string;
  beneficiary_id: string;
  product_id: string;
  organization_id?: string | null;
  points_used: number;
  redemption_date: string;
};
