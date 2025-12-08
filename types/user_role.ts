export type UserRoleType = 
  | 'final_user'
  | 'cashier'
  | 'owner'
  | 'collaborator'
  | 'admin';

export type UserRole = {
  id: string;
  name: UserRoleType;
  display_name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserWithRole = {
  id: string;
  organization_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username?: string | null;
  active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  role_name?: UserRoleType | null;
  role_display_name?: string | null;
  user_type: 'app_user' | 'beneficiary';
};
