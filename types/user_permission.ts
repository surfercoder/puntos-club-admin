import type { AppUser } from './app_user';
import type { Branch } from './branch';

export type UserPermission = {
  id: string;
  user_id: string;
  branch_id: string;
  action: string;
  assignment_date: string;
};

export type UserPermissionWithRelations = UserPermission & {
  user?: AppUser;
  branch?: Branch;
};
