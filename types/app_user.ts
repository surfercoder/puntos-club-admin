import type { Assignment } from './assignment';
import type { Organization } from './organization';
import type { UserPermission } from './user_permission';

export type AppUser = {
  id: string;
  organization_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username?: string | null;
  password?: string | null;
  active: boolean;
};

export type AppUserWithRelations = AppUser & {
  organization?: Organization;
  user_permissions?: UserPermission[];
  assignments?: Assignment[];
};
