import type { Organization } from './organization';
import type { UserRole } from './user_role';

export type User = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  username?: string | null;
  password?: string | null;
  phone?: string | null;
  document_id?: string | null;
  active: boolean;
  role_id: string;
  user_type: 'app_user' | 'beneficiary';
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserWithRelations = User & {
  organization?: Organization;
  role?: UserRole;
};
