import {
  ROLE_ENTITY_ACCESS,
  canAccessEntity,
  getAccessibleEntities,
  type EntityName,
} from '@/lib/auth/permissions';
import type { UserRoleType } from '@/types/user_role';

const ALL_ENTITIES: EntityName[] = [
  'address',
  'beneficiary',
  'beneficiary_organization',
  'branch',
  'organization',
  'category',
  'product',
  'app_order',
  'app_user',
  'app_user_organization',
  'redemption',
  'stock',
  'users',
  'points-rules',
];

const ALL_ROLES: UserRoleType[] = ['admin', 'owner', 'collaborator', 'cashier', 'final_user'];

describe('ROLE_ENTITY_ACCESS', () => {
  it('has entries for all roles', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_ENTITY_ACCESS[role]).toBeDefined();
    }
  });

  it('each role has entries for all entities', () => {
    for (const role of ALL_ROLES) {
      for (const entity of ALL_ENTITIES) {
        expect(ROLE_ENTITY_ACCESS[role][entity]).toBeDefined();
        expect(ROLE_ENTITY_ACCESS[role][entity]).toHaveProperty('view');
        expect(ROLE_ENTITY_ACCESS[role][entity]).toHaveProperty('create');
        expect(ROLE_ENTITY_ACCESS[role][entity]).toHaveProperty('edit');
        expect(ROLE_ENTITY_ACCESS[role][entity]).toHaveProperty('delete');
      }
    }
  });

  it('admin has full access to all entities', () => {
    for (const entity of ALL_ENTITIES) {
      expect(ROLE_ENTITY_ACCESS.admin[entity]).toEqual({
        view: true,
        create: true,
        edit: true,
        delete: true,
      });
    }
  });

  it('final_user has no access to any entity', () => {
    for (const entity of ALL_ENTITIES) {
      expect(ROLE_ENTITY_ACCESS.final_user[entity]).toEqual({
        view: false,
        create: false,
        edit: false,
        delete: false,
      });
    }
  });

  it('owner cannot create or delete organizations', () => {
    expect(ROLE_ENTITY_ACCESS.owner.organization.create).toBe(false);
    expect(ROLE_ENTITY_ACCESS.owner.organization.delete).toBe(false);
    expect(ROLE_ENTITY_ACCESS.owner.organization.view).toBe(true);
    expect(ROLE_ENTITY_ACCESS.owner.organization.edit).toBe(true);
  });

  it('collaborator has read-only access to organization', () => {
    expect(ROLE_ENTITY_ACCESS.collaborator.organization).toEqual({
      view: true,
      create: false,
      edit: false,
      delete: false,
    });
  });

  it('collaborator cannot delete any entity', () => {
    for (const entity of ALL_ENTITIES) {
      expect(ROLE_ENTITY_ACCESS.collaborator[entity].delete).toBe(false);
    }
  });

  it('cashier has limited access', () => {
    expect(ROLE_ENTITY_ACCESS.cashier.address.view).toBe(false);
    expect(ROLE_ENTITY_ACCESS.cashier.beneficiary.view).toBe(true);
    expect(ROLE_ENTITY_ACCESS.cashier.beneficiary.create).toBe(true);
    expect(ROLE_ENTITY_ACCESS.cashier.app_order.create).toBe(true);
    expect(ROLE_ENTITY_ACCESS.cashier.product.view).toBe(true);
    expect(ROLE_ENTITY_ACCESS.cashier.product.create).toBe(false);
    expect(ROLE_ENTITY_ACCESS.cashier.users.view).toBe(false);
  });
});

describe('canAccessEntity', () => {
  it('defaults to view action', () => {
    expect(canAccessEntity('admin', 'beneficiary')).toBe(true);
    expect(canAccessEntity('final_user', 'beneficiary')).toBe(false);
  });

  it('checks specific actions', () => {
    expect(canAccessEntity('admin', 'organization', 'delete')).toBe(true);
    expect(canAccessEntity('owner', 'organization', 'create')).toBe(false);
    expect(canAccessEntity('owner', 'organization', 'edit')).toBe(true);
    expect(canAccessEntity('collaborator', 'beneficiary', 'create')).toBe(true);
    expect(canAccessEntity('collaborator', 'beneficiary', 'delete')).toBe(false);
    expect(canAccessEntity('cashier', 'app_order', 'create')).toBe(true);
    expect(canAccessEntity('cashier', 'app_order', 'delete')).toBe(false);
  });

  it('returns false for null role', () => {
    expect(canAccessEntity(null as any, 'beneficiary')).toBe(false);
  });

  it('returns false for undefined role', () => {
    expect(canAccessEntity(undefined as any, 'beneficiary')).toBe(false);
  });

  it('returns false for invalid role', () => {
    expect(canAccessEntity('nonexistent' as any, 'beneficiary')).toBe(false);
  });

  it('returns false for invalid entity', () => {
    expect(canAccessEntity('admin', 'nonexistent' as any)).toBe(false);
  });
});

describe('getAccessibleEntities', () => {
  it('admin can view all entities', () => {
    const entities = getAccessibleEntities('admin');
    expect(entities).toEqual(ALL_ENTITIES);
  });

  it('owner can view all entities', () => {
    const entities = getAccessibleEntities('owner');
    expect(entities).toEqual(ALL_ENTITIES);
  });

  it('collaborator can view most entities', () => {
    const entities = getAccessibleEntities('collaborator');
    expect(entities).toContain('beneficiary');
    expect(entities).toContain('branch');
    expect(entities).toContain('organization');
    expect(entities).toContain('product');
    expect(entities).toContain('app_user');
    expect(entities).not.toContain('app_user_organization');
  });

  it('cashier can view limited entities', () => {
    const entities = getAccessibleEntities('cashier');
    expect(entities).toContain('beneficiary');
    expect(entities).toContain('app_order');
    expect(entities).toContain('product');
    expect(entities).toContain('stock');
    expect(entities).not.toContain('address');
    expect(entities).not.toContain('organization');
    expect(entities).not.toContain('app_user');
    expect(entities).not.toContain('users');
  });

  it('final_user cannot view any entity', () => {
    expect(getAccessibleEntities('final_user')).toEqual([]);
  });

  it('returns empty array for null role', () => {
    expect(getAccessibleEntities(null as any)).toEqual([]);
  });

  it('returns empty array for undefined role', () => {
    expect(getAccessibleEntities(undefined as any)).toEqual([]);
  });

  it('returns empty array for invalid role', () => {
    expect(getAccessibleEntities('nonexistent' as any)).toEqual([]);
  });
});
