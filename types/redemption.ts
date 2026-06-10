export type RedemptionStatus = 'pending' | 'delivered' | 'cancelled';

export type Redemption = {
  id: string;
  beneficiary_id: string;
  product_id: string;
  organization_id?: string | null;
  points_used: number;
  redemption_date: string;
  status?: RedemptionStatus;
  requested_at?: string | null;
  delivered_at?: string | null;
  delivered_by?: number | null;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  cancellation_reason?: string | null;
};
