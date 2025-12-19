import type { AppUser } from './app_user';
import type { Organization } from './organization';

export type AppUserOrganization = {
  id: string;
  app_user_id: string;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AppUserOrganizationWithRelations = AppUserOrganization & {
  app_user?: AppUser;
  organization?: Organization;
};
