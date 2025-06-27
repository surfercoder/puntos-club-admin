import type { Assignment } from './assignment';
import type { Redemption } from './redemption';

export type Beneficiary = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  document_id?: string | null;
  available_points: number;
  registration_date: string;
};

export type BeneficiaryWithRelations = Beneficiary & {
  assignments?: Assignment[];
  redemptions?: Redemption[];
};
