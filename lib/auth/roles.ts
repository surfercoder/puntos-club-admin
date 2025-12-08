import type { UserRoleType } from '@/types/user_role';
import type { AppUser } from '@/types/app_user';
import type { Beneficiary } from '@/types/beneficiary';

/**
 * Role hierarchy and permissions utility functions
 */

export const USER_ROLES = {
  FINAL_USER: 'final_user' as const,
  CASHIER: 'cashier' as const,
  OWNER: 'owner' as const,
  COLLABORATOR: 'collaborator' as const,
  ADMIN: 'admin' as const,
};

export const ROLE_DISPLAY_NAMES: Record<UserRoleType, string> = {
  final_user: 'Final User',
  cashier: 'Cashier',
  owner: 'Owner',
  collaborator: 'Collaborator',
  admin: 'Admin',
};

export const ROLE_DESCRIPTIONS: Record<UserRoleType, string> = {
  final_user: 'Users of PuntosClub mobile app who make purchases and redeem points',
  cashier: 'Store employees using PuntosClubCaja app to process purchases and redemptions',
  owner: 'Store owners with full admin access to their stores',
  collaborator: 'Helper users added by owners with limited admin permissions',
  admin: 'System administrators with full access to all apps and entities',
};

/**
 * Actions that collaborators cannot perform
 */
export const RESTRICTED_COLLABORATOR_ACTIONS = {
  CREATE_COLLABORATOR: 'create_collaborator',
  DELETE_COLLABORATOR: 'delete_collaborator',
  MODIFY_OWNER_SETTINGS: 'modify_owner_settings',
  DELETE_ORGANIZATION: 'delete_organization',
  TRANSFER_OWNERSHIP: 'transfer_ownership',
} as const;

/**
 * Check if a user has a specific role
 */
export function hasRole(user: AppUser | Beneficiary | null | undefined, role: UserRoleType): boolean {
  if (!user) return false;
  
  // For users with role relation loaded
  if ('role' in user && user.role && typeof user.role === 'object' && 'name' in user.role) {
    return user.role.name === role;
  }
  
  return false;
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: AppUser | Beneficiary | null | undefined): boolean {
  return hasRole(user, USER_ROLES.ADMIN);
}

/**
 * Check if a user is an owner
 */
export function isOwner(user: AppUser | null | undefined): boolean {
  return hasRole(user, USER_ROLES.OWNER);
}

/**
 * Check if a user is a collaborator
 */
export function isCollaborator(user: AppUser | null | undefined): boolean {
  return hasRole(user, USER_ROLES.COLLABORATOR);
}

/**
 * Check if a user is a cashier
 */
export function isCashier(user: AppUser | null | undefined): boolean {
  return hasRole(user, USER_ROLES.CASHIER);
}

/**
 * Check if a user is a final user (beneficiary)
 */
export function isFinalUser(user: Beneficiary | null | undefined): boolean {
  return hasRole(user, USER_ROLES.FINAL_USER);
}

/**
 * Check if a user is an owner or admin
 */
export function isOwnerOrAdmin(user: AppUser | null | undefined): boolean {
  return isOwner(user) || isAdmin(user);
}

/**
 * Check if a user has staff permissions (cashier, owner, collaborator, or admin)
 */
export function isStaff(user: AppUser | null | undefined): boolean {
  if (!user) return false;
  return isCashier(user) || isOwner(user) || isCollaborator(user) || isAdmin(user);
}

/**
 * Check if a user can perform a specific action
 * Admins can do everything
 * Owners can do everything except system-level actions
 * Collaborators have restrictions defined in RESTRICTED_COLLABORATOR_ACTIONS
 */
export function canPerformAction(
  user: AppUser | null | undefined,
  action: string
): boolean {
  if (!user) return false;
  
  // Admins can do everything
  if (isAdmin(user)) return true;
  
  // Owners can do everything except restricted actions
  if (isOwner(user)) {
    // Owners cannot perform system-level admin actions
    const systemActions = ['delete_all_organizations', 'manage_system_settings'];
    return !systemActions.includes(action);
  }
  
  // Collaborators have specific restrictions
  if (isCollaborator(user)) {
    const restrictedActions: string[] = Object.values(RESTRICTED_COLLABORATOR_ACTIONS);
    return !restrictedActions.includes(action);
  }
  
  // Cashiers have limited permissions
  if (isCashier(user)) {
    const allowedActions = [
      'process_orders',
      'manage_beneficiaries',
      'view_products',
      'view_stock',
      'create_assignments',
      'process_redemptions',
    ];
    return allowedActions.includes(action);
  }
  
  return false;
}

/**
 * Check if a user belongs to a specific organization
 */
export function belongsToOrganization(
  user: AppUser | null | undefined,
  organizationId: string
): boolean {
  if (!user) return false;
  return user.organization_id === organizationId;
}

/**
 * Get the user's role display name
 */
export function getUserRoleDisplayName(user: AppUser | Beneficiary | null | undefined): string {
  if (!user) return 'Unknown';
  
  if ('role' in user && user.role && typeof user.role === 'object' && 'display_name' in user.role) {
    const displayName = user.role.display_name;
    return typeof displayName === 'string' ? displayName : 'Unknown';
  }
  
  return 'Unknown';
}

/**
 * Get the user's role description
 */
export function getUserRoleDescription(user: AppUser | Beneficiary | null | undefined): string {
  if (!user) return '';
  
  if ('role' in user && user.role && typeof user.role === 'object' && 'description' in user.role) {
    const description = user.role.description;
    return typeof description === 'string' ? description : '';
  }
  
  return '';
}

/**
 * Check if a user can manage another user
 * Admins can manage anyone
 * Owners can manage users in their organization (except other owners and admins)
 * Collaborators cannot manage other users
 */
export function canManageUser(
  currentUser: AppUser | null | undefined,
  targetUser: AppUser | null | undefined
): boolean {
  if (!currentUser || !targetUser) return false;
  
  // Admins can manage anyone
  if (isAdmin(currentUser)) return true;
  
  // Users cannot manage themselves through this function
  if (currentUser.id === targetUser.id) return false;
  
  // Owners can manage users in their organization
  if (isOwner(currentUser)) {
    // Must be in same organization
    if (!belongsToOrganization(targetUser, currentUser.organization_id)) {
      return false;
    }
    
    // Cannot manage other owners or admins
    if (isOwner(targetUser) || isAdmin(targetUser)) {
      return false;
    }
    
    return true;
  }
  
  // Collaborators and cashiers cannot manage other users
  return false;
}

/**
 * Get all roles that a user can assign to others
 */
export function getAssignableRoles(user: AppUser | null | undefined): UserRoleType[] {
  if (!user) return [];
  
  // Admins can assign any role
  if (isAdmin(user)) {
    return [
      USER_ROLES.FINAL_USER,
      USER_ROLES.CASHIER,
      USER_ROLES.OWNER,
      USER_ROLES.COLLABORATOR,
      USER_ROLES.ADMIN,
    ];
  }
  
  // Owners can assign cashier and collaborator roles
  if (isOwner(user)) {
    return [USER_ROLES.CASHIER, USER_ROLES.COLLABORATOR];
  }
  
  // Others cannot assign roles
  return [];
}
