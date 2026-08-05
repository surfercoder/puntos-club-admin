import type { Address } from './address';
import type { Organization } from './organization';

export type Branch = {
  id: string;
  organization_id: string;
  address_id?: string | null;
  name: string;
  phone?: string | null;
  active: boolean;
};

export type BranchWithRelations = Branch & {
  organization?: Organization;
  address?: Address;
};
