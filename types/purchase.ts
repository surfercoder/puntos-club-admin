export type PurchaseStatus = 'active' | 'cancelled';

export type Purchase = {
  id: string;
  purchase_number: string;
  beneficiary_id: string;
  cashier_id: string | null;
  branch_id?: string | null;
  total_amount: number;
  points_earned: number;
  purchase_date: string;
  notes?: string | null;
  organization_id?: string | null;
  status: PurchaseStatus;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
};

