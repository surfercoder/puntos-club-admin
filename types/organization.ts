import type { Branch } from './branch';
import type { AppUser } from './app_user';

export type Organization = {
  id: string;
  name: string;
  business_name?: string | null;
  tax_id?: string | null;
  creation_date: string; // ISO date string
};

export type OrganizationWithRelations = Organization & {
  branches?: Branch[];
  users?: AppUser[];
};
