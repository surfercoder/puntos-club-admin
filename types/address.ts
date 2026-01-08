import type { Branch } from './branch';

export type Address = {
  city: string;
  id: string;
  number: string;
  organization_id: string;
  state: string;
  street: string;
  zip_code: string;
};

export type AddressWithRelations = Address & {
  branch?: Branch;
};
