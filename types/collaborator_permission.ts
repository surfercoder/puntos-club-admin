import type { AppUser } from './app_user';

export type CollaboratorPermission = {
  id: string;
  collaborator_id: string;
  permission_type: string;
  can_execute: boolean;
  created_at: string;
  updated_at: string;
};

export type CollaboratorPermissionWithRelations = CollaboratorPermission & {
  collaborator?: AppUser;
};

export type RestrictedCollaboratorAction = {
  id: string;
  action_name: string;
  description?: string | null;
  created_at: string;
};

// Predefined restricted actions that collaborators cannot perform
export const RESTRICTED_ACTIONS = {
  CREATE_COLLABORATOR: 'create_collaborator',
  DELETE_COLLABORATOR: 'delete_collaborator',
  MODIFY_OWNER_SETTINGS: 'modify_owner_settings',
  DELETE_ORGANIZATION: 'delete_organization',
  TRANSFER_OWNERSHIP: 'transfer_ownership',
} as const;

export type RestrictedActionType = typeof RESTRICTED_ACTIONS[keyof typeof RESTRICTED_ACTIONS];
