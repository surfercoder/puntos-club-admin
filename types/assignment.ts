import type { AppUser } from './app_user';
import type { Beneficiary } from './beneficiary';
import type { Branch } from './branch';

export type Assignment = {
  id: string;
  branch_id: string;
  beneficiary_id: string;
  user_id?: string | null;
  points: number;
  reason?: string | null;
  assignment_date: string;
  observations?: string | null;
};

export type AssignmentWithRelations = Assignment & {
  branch?: Branch;
  beneficiary?: Beneficiary;
  user?: AppUser;
};
