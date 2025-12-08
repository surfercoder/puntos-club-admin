import type { Assignment } from './assignment';
import type { Organization } from './organization';
import type { UserPermission } from './user_permission';
import type { UserRole } from './user_role';

export type AppUser = {
  id: string;
  organization_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username?: string | null;
  password?: string | null;
  active: boolean;
  role_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type AppUserWithRelations = AppUser & {
  organization?: Organization;
  user_permissions?: UserPermission[];
  assignments?: Assignment[];
  role?: UserRole;
  creator?: AppUser;
};
