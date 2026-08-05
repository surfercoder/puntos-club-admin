import type { UserRoleType } from '@/types/user_role';

/**
 * Entity access permissions configuration
 * Defines which entities each role can access
 */

export type EntityName =
  | 'address'
  | 'beneficiary'
  | 'beneficiary_organization'
  | 'branch'
  | 'organization'
  | 'category'
  | 'product'

  | 'app_user'
  | 'app_user_organization'
  | 'redemption'
  | 'users'
  | 'points-rules';

export type EntityPermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

/**
 * Owner-level access: full access to their organization's data.
 * Collaborators share it — they are staff the owner creates and designates.
 */
const OWNER_ENTITY_ACCESS: Record<EntityName, EntityPermissions> = {
  address: { view: true, create: true, edit: true, delete: true },
  beneficiary: { view: true, create: true, edit: true, delete: true },
  beneficiary_organization: { view: true, create: true, edit: true, delete: true },
  branch: { view: true, create: true, edit: true, delete: true },
  organization: { view: true, create: false, edit: true, delete: false }, // Can view/edit their org, not create/delete
  category: { view: true, create: true, edit: true, delete: true },
  product: { view: true, create: true, edit: true, delete: true },
  app_user: { view: true, create: true, edit: true, delete: true },
  app_user_organization: { view: true, create: true, edit: true, delete: true },
  redemption: { view: true, create: true, edit: true, delete: true },
  users: { view: true, create: true, edit: true, delete: true },
  'points-rules': { view: true, create: true, edit: true, delete: true },
};

/**
 * Define what each role can access
 * Admin: Full access to everything
 * Owner: Full access to their organization's data, cannot manage other organizations
 * Collaborator: Same as owner
 * Cashier: Very limited access, mainly for processing transactions
 */
export const ROLE_ENTITY_ACCESS: Record<UserRoleType, Record<EntityName, EntityPermissions>> = {
  admin: {
    // Admins have full access to everything
    address: { view: true, create: true, edit: true, delete: true },
    beneficiary: { view: true, create: true, edit: true, delete: true },
    beneficiary_organization: { view: true, create: true, edit: true, delete: true },
    branch: { view: true, create: true, edit: true, delete: true },
    organization: { view: true, create: true, edit: true, delete: true },
    category: { view: true, create: true, edit: true, delete: true },
    product: { view: true, create: true, edit: true, delete: true },
    app_user: { view: true, create: true, edit: true, delete: true },
    app_user_organization: { view: true, create: true, edit: true, delete: true },
    redemption: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    'points-rules': { view: true, create: true, edit: true, delete: true },
  },
  owner: OWNER_ENTITY_ACCESS,
  collaborator: OWNER_ENTITY_ACCESS,
  cashier: {
    // Cashiers have very limited access, mainly for transactions
    address: { view: false, create: false, edit: false, delete: false },
    beneficiary: { view: true, create: true, edit: true, delete: false },
    beneficiary_organization: { view: true, create: false, edit: false, delete: false },
    branch: { view: true, create: false, edit: false, delete: false }, // Read-only
    organization: { view: false, create: false, edit: false, delete: false },
    category: { view: true, create: false, edit: false, delete: false }, // Read-only
    product: { view: true, create: false, edit: false, delete: false }, // Read-only
    app_user: { view: false, create: false, edit: false, delete: false },
    app_user_organization: { view: false, create: false, edit: false, delete: false },
    redemption: { view: true, create: true, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    'points-rules': { view: true, create: false, edit: false, delete: false }, // Read-only
  },
  final_user: {
    // Final users (beneficiaries) should not access the admin portal
    address: { view: false, create: false, edit: false, delete: false },
    beneficiary: { view: false, create: false, edit: false, delete: false },
    beneficiary_organization: { view: false, create: false, edit: false, delete: false },
    branch: { view: false, create: false, edit: false, delete: false },
    organization: { view: false, create: false, edit: false, delete: false },
    category: { view: false, create: false, edit: false, delete: false },
    product: { view: false, create: false, edit: false, delete: false },
    app_user: { view: false, create: false, edit: false, delete: false },
    app_user_organization: { view: false, create: false, edit: false, delete: false },
    redemption: { view: false, create: false, edit: false, delete: false },
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
