import type { AppUser } from './app_user';
import type { Branch } from './branch';
import type { PlanType } from './plan';

export type Organization = {
  id: string;
  name: string;
  business_name?: string | null;
  tax_id?: string | null;
  logo_url?: string | null;
  creation_date: string;
  plan: PlanType;
  trial_started_at?: string | null;
};

export type OrganizationWithRelations = Organization & {
  branches?: Branch[];
  users?: AppUser[];
};
