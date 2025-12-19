import type { UserRoleType } from '@/types/user_role';

/**
 * Entity access permissions configuration
 * Defines which entities each role can access
 */

export type EntityName = 
  | 'address'
  | 'assignment'
  | 'beneficiary'
  | 'beneficiary_organization'
  | 'branch'
  | 'organization'
  | 'category'
  | 'status'
  | 'product'
  | 'app_order'
  | 'app_user'
  | 'app_user_organization'
  | 'history'
  | 'redemption'
  | 'stock'
  | 'user_permission'
  | 'collaborator_permission'
  | 'restricted_collaborator_action'
  | 'users'
  | 'points-rules';

export type EntityPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

/**
 * Define what each role can access
 * Admin: Full access to everything
 * Owner: Full access to their organization's data, cannot manage other organizations
 * Collaborator: Limited access, cannot manage collaborators or owner settings
 * Cashier: Very limited access, mainly for processing transactions
 */
export const ROLE_ENTITY_ACCESS: Record<UserRoleType, Record<EntityName, EntityPermissions>> = {
  admin: {
    // Admins have full access to everything
    address: { view: true, create: true, edit: true, delete: true },
    assignment: { view: true, create: true, edit: true, delete: true },
    beneficiary: { view: true, create: true, edit: true, delete: true },
    beneficiary_organization: { view: true, create: true, edit: true, delete: true },
    branch: { view: true, create: true, edit: true, delete: true },
    organization: { view: true, create: true, edit: true, delete: true },
    category: { view: true, create: true, edit: true, delete: true },
    status: { view: true, create: true, edit: true, delete: true },
    product: { view: true, create: true, edit: true, delete: true },
    app_order: { view: true, create: true, edit: true, delete: true },
    app_user: { view: true, create: true, edit: true, delete: true },
    app_user_organization: { view: true, create: true, edit: true, delete: true },
    history: { view: true, create: true, edit: true, delete: true },
    redemption: { view: true, create: true, edit: true, delete: true },
    stock: { view: true, create: true, edit: true, delete: true },
    user_permission: { view: true, create: true, edit: true, delete: true },
    collaborator_permission: { view: true, create: true, edit: true, delete: true },
    restricted_collaborator_action: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    'points-rules': { view: true, create: true, edit: true, delete: true },
  },
  owner: {
    // Owners have full access to their organization's data
    address: { view: true, create: true, edit: true, delete: true },
    assignment: { view: true, create: true, edit: true, delete: true },
    beneficiary: { view: true, create: true, edit: true, delete: true },
    beneficiary_organization: { view: true, create: true, edit: true, delete: true },
    branch: { view: true, create: true, edit: true, delete: true },
    organization: { view: true, create: false, edit: true, delete: false }, // Can view/edit their org, not create/delete
    category: { view: true, create: true, edit: true, delete: true },
    status: { view: true, create: false, edit: false, delete: false }, // Read-only
    product: { view: true, create: true, edit: true, delete: true },
    app_order: { view: true, create: true, edit: true, delete: true },
    app_user: { view: true, create: true, edit: true, delete: true },
    app_user_organization: { view: true, create: true, edit: true, delete: true },
    history: { view: true, create: true, edit: true, delete: false },
    redemption: { view: true, create: true, edit: true, delete: true },
    stock: { view: true, create: true, edit: true, delete: true },
    user_permission: { view: true, create: true, edit: true, delete: true },
    collaborator_permission: { view: true, create: true, edit: true, delete: true },
    restricted_collaborator_action: { view: true, create: false, edit: false, delete: false },
    users: { view: true, create: true, edit: true, delete: true },
    'points-rules': { view: true, create: true, edit: true, delete: true },
  },
  collaborator: {
    // Collaborators have limited access, cannot manage users or settings
    address: { view: true, create: true, edit: true, delete: false },
    assignment: { view: true, create: true, edit: true, delete: false },
    beneficiary: { view: true, create: true, edit: true, delete: false },
    beneficiary_organization: { view: true, create: false, edit: false, delete: false },
    branch: { view: true, create: false, edit: true, delete: false },
    organization: { view: true, create: false, edit: false, delete: false }, // Read-only
    category: { view: true, create: true, edit: true, delete: false },
    status: { view: true, create: false, edit: false, delete: false }, // Read-only
    product: { view: true, create: true, edit: true, delete: false },
    app_order: { view: true, create: true, edit: true, delete: false },
    app_user: { view: true, create: false, edit: false, delete: false }, // Read-only, cannot manage users
    app_user_organization: { view: false, create: false, edit: false, delete: false },
    history: { view: true, create: true, edit: false, delete: false },
    redemption: { view: true, create: true, edit: true, delete: false },
    stock: { view: true, create: true, edit: true, delete: false },
    user_permission: { view: false, create: false, edit: false, delete: false }, // No access
    collaborator_permission: { view: false, create: false, edit: false, delete: false },
    restricted_collaborator_action: { view: false, create: false, edit: false, delete: false },
    users: { view: true, create: false, edit: false, delete: false }, // Read-only
    'points-rules': { view: true, create: false, edit: true, delete: false },
  },
  cashier: {
    // Cashiers have very limited access, mainly for transactions
    address: { view: false, create: false, edit: false, delete: false },
    assignment: { view: true, create: true, edit: false, delete: false },
    beneficiary: { view: true, create: true, edit: true, delete: false },
    beneficiary_organization: { view: true, create: false, edit: false, delete: false },
    branch: { view: true, create: false, edit: false, delete: false }, // Read-only
    organization: { view: false, create: false, edit: false, delete: false },
    category: { view: true, create: false, edit: false, delete: false }, // Read-only
    status: { view: true, create: false, edit: false, delete: false }, // Read-only
    product: { view: true, create: false, edit: false, delete: false }, // Read-only
    app_order: { view: true, create: true, edit: true, delete: false },
    app_user: { view: false, create: false, edit: false, delete: false },
    app_user_organization: { view: false, create: false, edit: false, delete: false },
    history: { view: true, create: false, edit: false, delete: false }, // Read-only
    redemption: { view: true, create: true, edit: false, delete: false },
    stock: { view: true, create: false, edit: false, delete: false }, // Read-only
    user_permission: { view: false, create: false, edit: false, delete: false },
    collaborator_permission: { view: false, create: false, edit: false, delete: false },
    restricted_collaborator_action: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    'points-rules': { view: true, create: false, edit: false, delete: false }, // Read-only
  },
  final_user: {
    // Final users (beneficiaries) should not access the admin portal
    address: { view: false, create: false, edit: false, delete: false },
    assignment: { view: false, create: false, edit: false, delete: false },
    beneficiary: { view: false, create: false, edit: false, delete: false },
    beneficiary_organization: { view: false, create: false, edit: false, delete: false },
    branch: { view: false, create: false, edit: false, delete: false },
    organization: { view: false, create: false, edit: false, delete: false },
    category: { view: false, create: false, edit: false, delete: false },
    status: { view: false, create: false, edit: false, delete: false },
    product: { view: false, create: false, edit: false, delete: false },
    app_order: { view: false, create: false, edit: false, delete: false },
    app_user: { view: false, create: false, edit: false, delete: false },
    app_user_organization: { view: false, create: false, edit: false, delete: false },
    history: { view: false, create: false, edit: false, delete: false },
    redemption: { view: false, create: false, edit: false, delete: false },
    stock: { view: false, create: false, edit: false, delete: false },
    user_permission: { view: false, create: false, edit: false, delete: false },
    collaborator_permission: { view: false, create: false, edit: false, delete: false },
    restricted_collaborator_action: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    'points-rules': { view: false, create: false, edit: false, delete: false },
  },
};

/**
 * Check if a role can access an entity
 */
export function canAccessEntity(
  role: UserRoleType | undefined | null,
  entity: EntityName,
  action: keyof EntityPermissions = 'view'
): boolean {
  if (!role) return false;
  
  const permissions = ROLE_ENTITY_ACCESS[role]?.[entity];
  if (!permissions) return false;
  
  return permissions[action];
}

/**
 * Get all entities a role can view
 */
export function getAccessibleEntities(role: UserRoleType | undefined | null): EntityName[] {
  if (!role) return [];
  
  const rolePermissions = ROLE_ENTITY_ACCESS[role];
  if (!rolePermissions) return [];
  
  return (Object.keys(rolePermissions) as EntityName[]).filter(
    entity => rolePermissions[entity].view
  );
}
