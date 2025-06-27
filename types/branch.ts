import type { Organization } from './organization';
import type { Address } from './address';
import type { Stock } from './stock';
import type { Assignment } from './assignment';

export type Branch = {
  id: string;
  organization_id: string;
  address_id?: string | null;
  name: string;
  code?: string | null;
  phone?: string | null;
  active: boolean;
};

export type BranchWithRelations = Branch & {
  organization?: Organization;
  address?: Address;
  stock?: Stock[];
  assignments?: Assignment[];
};
