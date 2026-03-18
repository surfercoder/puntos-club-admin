import type { Beneficiary } from './beneficiary';
import type { Organization } from './organization';

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

export type PurchaseWithRelations = Purchase & {
  beneficiary?: Beneficiary;
  cashier?: { first_name: string; last_name: string };
  branch?: { name: string; organization_id?: number };
  organization?: Organization;
};
