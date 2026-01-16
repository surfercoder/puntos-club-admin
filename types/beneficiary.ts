import type { Assignment } from './assignment';
import type { Redemption } from './redemption';
import type { UserRole } from './user_role';
import type { Address } from './address';

export type Beneficiary = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  document_id?: string | null;
  available_points: number;
  registration_date: string;
  role_id?: string | null;
  address_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type BeneficiaryWithRelations = Beneficiary & {
  assignments?: Assignment[];
  redemptions?: Redemption[];
  role?: UserRole;
  address?: Address;
};
