import type { Beneficiary } from './beneficiary';
import type { Organization } from './organization';

export type BeneficiaryOrganization = {
  id: string;
  beneficiary_id: string;
  organization_id: string;
  available_points: number;
  total_points_earned: number;
  total_points_redeemed: number;
  joined_date: string;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BeneficiaryOrganizationWithRelations = BeneficiaryOrganization & {
  beneficiary?: Beneficiary;
  organization?: Organization;
};
