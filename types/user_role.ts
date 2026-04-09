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

