export type Purchase = {
  id: string;
  purchase_number: string;
  beneficiary_id: string;
  cashier_id: string;
  branch_id?: string | null;
  total_amount: number;
  points_earned: number;
  purchase_date: string;
  notes?: string | null;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
};

