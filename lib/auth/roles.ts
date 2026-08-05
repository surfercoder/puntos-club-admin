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
  collaborator: 'Right-hand staff added by owners, with the same admin permissions',
  admin: 'System administrators with full access to all apps and entities',
};

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
 * Collaborators are employees/right-hands that owners create and designate
 * themselves, so they get the exact same permissions as an owner.
 * ponytail: single gate for the whole admin portal — split it per-section only
 * when collaborators actually need narrower permissions.
 */
export function hasOwnerPermissions(user: AppUser | null | undefined): boolean {
  return isOwner(user) || isCollaborator(user) || isAdmin(user);
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
 * Owners and collaborators can do everything except system-level actions
 */
export function canPerformAction(
  user: AppUser | null | undefined,
  action: string
): boolean {
  if (!user) return false;

  // Admins can do everything
  if (isAdmin(user)) return true;

  // Owners (and collaborators) can do everything except restricted actions
  if (isOwner(user) || isCollaborator(user)) {
    // Owners cannot perform system-level admin actions
    const systemActions = ['delete_all_organizations', 'manage_system_settings'];
    return !systemActions.includes(action);
  }

  // Cashiers have limited permissions
  if (isCashier(user)) {
    const allowedActions = [
      'process_orders',
      'manage_beneficiaries',
      'view_products',
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
 * Owners and collaborators can manage users in their organization
 * (except other owners and admins)
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
  
  // Owners and collaborators can manage users in their organization
  if (isOwner(currentUser) || isCollaborator(currentUser)) {
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

  // Cashiers cannot manage other users
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
  
  // Owners and collaborators can assign cashier and collaborator roles
  if (isOwner(user) || isCollaborator(user)) {
    return [USER_ROLES.CASHIER, USER_ROLES.COLLABORATOR];
  }
  
  // Others cannot assign roles
  return [];
}
