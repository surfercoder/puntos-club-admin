import {
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  RESTRICTED_COLLABORATOR_ACTIONS,
  hasRole,
  isAdmin,
  isOwner,
  isCollaborator,
  isCashier,
  isFinalUser,
  isOwnerOrAdmin,
  isStaff,
  canPerformAction,
  belongsToOrganization,
  getUserRoleDisplayName,
  getUserRoleDescription,
  canManageUser,
  getAssignableRoles,
} from '@/lib/auth/roles';

// Helper to create mock users
function mockUser(roleName: string, overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id ?? 'user-1',
    organization_id: overrides.organization_id ?? 'org-1',
    active: true,
    tour_completed: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    role: {
      id: 'role-1',
      name: roleName,
      display_name: ROLE_DISPLAY_NAMES[roleName as keyof typeof ROLE_DISPLAY_NAMES] ?? 'Unknown',
      description: ROLE_DESCRIPTIONS[roleName as keyof typeof ROLE_DESCRIPTIONS] ?? null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    ...overrides,
  } as any;
}

describe('constants', () => {
  it('USER_ROLES contains all five roles', () => {
    expect(USER_ROLES).toEqual({
      FINAL_USER: 'final_user',
      CASHIER: 'cashier',
      OWNER: 'owner',
      COLLABORATOR: 'collaborator',
      ADMIN: 'admin',
    });
  });

  it('ROLE_DISPLAY_NAMES covers all roles', () => {
    const roles = Object.values(USER_ROLES);
    for (const role of roles) {
      expect(ROLE_DISPLAY_NAMES[role]).toBeDefined();
    }
  });

  it('ROLE_DESCRIPTIONS covers all roles', () => {
    const roles = Object.values(USER_ROLES);
    for (const role of roles) {
      expect(ROLE_DESCRIPTIONS[role]).toBeDefined();
      expect(typeof ROLE_DESCRIPTIONS[role]).toBe('string');
    }
  });

  it('RESTRICTED_COLLABORATOR_ACTIONS has expected actions', () => {
    expect(RESTRICTED_COLLABORATOR_ACTIONS.CREATE_COLLABORATOR).toBe('create_collaborator');
    expect(RESTRICTED_COLLABORATOR_ACTIONS.DELETE_COLLABORATOR).toBe('delete_collaborator');
    expect(RESTRICTED_COLLABORATOR_ACTIONS.MODIFY_OWNER_SETTINGS).toBe('modify_owner_settings');
    expect(RESTRICTED_COLLABORATOR_ACTIONS.DELETE_ORGANIZATION).toBe('delete_organization');
    expect(RESTRICTED_COLLABORATOR_ACTIONS.TRANSFER_OWNERSHIP).toBe('transfer_ownership');
  });
});

describe('hasRole', () => {
  it('returns true when user has matching role', () => {
    expect(hasRole(mockUser('admin'), 'admin')).toBe(true);
  });

  it('returns false when user has different role', () => {
    expect(hasRole(mockUser('cashier'), 'admin')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(hasRole(null, 'admin')).toBe(false);
  });

  it('returns false for undefined user', () => {
    expect(hasRole(undefined, 'admin')).toBe(false);
  });

  it('returns false when user has no role object', () => {
    const user = { id: 'user-1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '' } as any;
    expect(hasRole(user, 'admin')).toBe(false);
  });

  it('returns false when role is not an object', () => {
    const user = { id: 'user-1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '', role: 'admin' } as any;
    expect(hasRole(user, 'admin')).toBe(false);
  });

  it('returns false when role object lacks name field', () => {
    const user = { id: 'user-1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '', role: { id: '1' } } as any;
    expect(hasRole(user, 'admin')).toBe(false);
  });
});

describe('role check functions', () => {
  it('isAdmin returns true only for admin', () => {
    expect(isAdmin(mockUser('admin'))).toBe(true);
    expect(isAdmin(mockUser('owner'))).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('isOwner returns true only for owner', () => {
    expect(isOwner(mockUser('owner'))).toBe(true);
    expect(isOwner(mockUser('admin'))).toBe(false);
    expect(isOwner(null)).toBe(false);
  });

  it('isCollaborator returns true only for collaborator', () => {
    expect(isCollaborator(mockUser('collaborator'))).toBe(true);
    expect(isCollaborator(mockUser('admin'))).toBe(false);
    expect(isCollaborator(null)).toBe(false);
  });

  it('isCashier returns true only for cashier', () => {
    expect(isCashier(mockUser('cashier'))).toBe(true);
    expect(isCashier(mockUser('admin'))).toBe(false);
    expect(isCashier(null)).toBe(false);
  });

  it('isFinalUser returns true only for final_user', () => {
    expect(isFinalUser(mockUser('final_user'))).toBe(true);
    expect(isFinalUser(mockUser('admin'))).toBe(false);
    expect(isFinalUser(null)).toBe(false);
  });
});

describe('isOwnerOrAdmin', () => {
  it('returns true for admin', () => {
    expect(isOwnerOrAdmin(mockUser('admin'))).toBe(true);
  });

  it('returns true for owner', () => {
    expect(isOwnerOrAdmin(mockUser('owner'))).toBe(true);
  });

  it('returns false for collaborator', () => {
    expect(isOwnerOrAdmin(mockUser('collaborator'))).toBe(false);
  });

  it('returns false for cashier', () => {
    expect(isOwnerOrAdmin(mockUser('cashier'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isOwnerOrAdmin(null)).toBe(false);
  });
});

describe('isStaff', () => {
  it('returns true for admin', () => {
    expect(isStaff(mockUser('admin'))).toBe(true);
  });

  it('returns true for owner', () => {
    expect(isStaff(mockUser('owner'))).toBe(true);
  });

  it('returns true for collaborator', () => {
    expect(isStaff(mockUser('collaborator'))).toBe(true);
  });

  it('returns true for cashier', () => {
    expect(isStaff(mockUser('cashier'))).toBe(true);
  });

  it('returns false for final_user', () => {
    expect(isStaff(mockUser('final_user'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isStaff(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isStaff(undefined)).toBe(false);
  });
});

describe('canPerformAction', () => {
  it('admin can perform any action', () => {
    const admin = mockUser('admin');
    expect(canPerformAction(admin, 'delete_all_organizations')).toBe(true);
    expect(canPerformAction(admin, 'manage_system_settings')).toBe(true);
    expect(canPerformAction(admin, 'anything')).toBe(true);
  });

  it('owner can perform most actions', () => {
    const owner = mockUser('owner');
    expect(canPerformAction(owner, 'create_collaborator')).toBe(true);
    expect(canPerformAction(owner, 'process_orders')).toBe(true);
  });

  it('owner cannot perform system-level actions', () => {
    const owner = mockUser('owner');
    expect(canPerformAction(owner, 'delete_all_organizations')).toBe(false);
    expect(canPerformAction(owner, 'manage_system_settings')).toBe(false);
  });

  it('collaborator cannot perform restricted actions', () => {
    const collab = mockUser('collaborator');
    expect(canPerformAction(collab, 'create_collaborator')).toBe(false);
    expect(canPerformAction(collab, 'delete_collaborator')).toBe(false);
    expect(canPerformAction(collab, 'modify_owner_settings')).toBe(false);
    expect(canPerformAction(collab, 'delete_organization')).toBe(false);
    expect(canPerformAction(collab, 'transfer_ownership')).toBe(false);
  });

  it('collaborator can perform non-restricted actions', () => {
    const collab = mockUser('collaborator');
    expect(canPerformAction(collab, 'process_orders')).toBe(true);
    expect(canPerformAction(collab, 'some_other_action')).toBe(true);
  });

  it('cashier can only perform allowed actions', () => {
    const cashier = mockUser('cashier');
    expect(canPerformAction(cashier, 'process_orders')).toBe(true);
    expect(canPerformAction(cashier, 'manage_beneficiaries')).toBe(true);
    expect(canPerformAction(cashier, 'view_products')).toBe(true);
    expect(canPerformAction(cashier, 'view_stock')).toBe(true);
    expect(canPerformAction(cashier, 'create_assignments')).toBe(true);
    expect(canPerformAction(cashier, 'process_redemptions')).toBe(true);
  });

  it('cashier cannot perform non-allowed actions', () => {
    const cashier = mockUser('cashier');
    expect(canPerformAction(cashier, 'create_collaborator')).toBe(false);
    expect(canPerformAction(cashier, 'delete_organization')).toBe(false);
    expect(canPerformAction(cashier, 'random_action')).toBe(false);
  });

  it('final_user cannot perform any action', () => {
    const user = mockUser('final_user');
    expect(canPerformAction(user, 'process_orders')).toBe(false);
    expect(canPerformAction(user, 'anything')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(canPerformAction(null, 'anything')).toBe(false);
  });

  it('returns false for undefined user', () => {
    expect(canPerformAction(undefined, 'anything')).toBe(false);
  });
});

describe('belongsToOrganization', () => {
  it('returns true when user belongs to the organization', () => {
    const user = mockUser('owner', { organization_id: 'org-abc' });
    expect(belongsToOrganization(user, 'org-abc')).toBe(true);
  });

  it('returns false when user belongs to a different organization', () => {
    const user = mockUser('owner', { organization_id: 'org-abc' });
    expect(belongsToOrganization(user, 'org-xyz')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(belongsToOrganization(null, 'org-abc')).toBe(false);
  });

  it('returns false for undefined user', () => {
    expect(belongsToOrganization(undefined, 'org-abc')).toBe(false);
  });
});

describe('getUserRoleDisplayName', () => {
  it('returns display_name from role', () => {
    const user = mockUser('admin');
    expect(getUserRoleDisplayName(user)).toBe('Admin');
  });

  it('returns "Unknown" for null user', () => {
    expect(getUserRoleDisplayName(null)).toBe('Unknown');
  });

  it('returns "Unknown" for undefined user', () => {
    expect(getUserRoleDisplayName(undefined)).toBe('Unknown');
  });

  it('returns "Unknown" when role has no display_name', () => {
    const user = { id: '1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '', role: { id: '1', name: 'admin' } } as any;
    expect(getUserRoleDisplayName(user)).toBe('Unknown');
  });

  it('returns "Unknown" when display_name is not a string', () => {
    const user = { id: '1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '', role: { id: '1', name: 'admin', display_name: 123 } } as any;
    expect(getUserRoleDisplayName(user)).toBe('Unknown');
  });

  it('returns "Unknown" when user has no role property', () => {
    const user = { id: '1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '' } as any;
    expect(getUserRoleDisplayName(user)).toBe('Unknown');
  });
});

describe('getUserRoleDescription', () => {
  it('returns description from role', () => {
    const user = mockUser('admin');
    expect(getUserRoleDescription(user)).toBe(ROLE_DESCRIPTIONS.admin);
  });

  it('returns empty string for null user', () => {
    expect(getUserRoleDescription(null)).toBe('');
  });

  it('returns empty string for undefined user', () => {
    expect(getUserRoleDescription(undefined)).toBe('');
  });

  it('returns empty string when role has no description', () => {
    const user = { id: '1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '', role: { id: '1', name: 'admin' } } as any;
    expect(getUserRoleDescription(user)).toBe('');
  });

  it('returns empty string when description is not a string', () => {
    const user = { id: '1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '', role: { id: '1', name: 'admin', description: 42 } } as any;
    expect(getUserRoleDescription(user)).toBe('');
  });

  it('returns empty string when user has no role property', () => {
    const user = { id: '1', organization_id: 'org-1', active: true, tour_completed: false, created_at: '', updated_at: '' } as any;
    expect(getUserRoleDescription(user)).toBe('');
  });
});

describe('canManageUser', () => {
  it('admin can manage anyone', () => {
    const admin = mockUser('admin', { id: 'admin-1' });
    const target = mockUser('owner', { id: 'owner-1' });
    expect(canManageUser(admin, target)).toBe(true);
  });

  it('admin can manage another admin', () => {
    const admin1 = mockUser('admin', { id: 'admin-1' });
    const admin2 = mockUser('admin', { id: 'admin-2' });
    expect(canManageUser(admin1, admin2)).toBe(true);
  });

  it('returns false when currentUser is null', () => {
    expect(canManageUser(null, mockUser('cashier'))).toBe(false);
  });

  it('returns false when targetUser is null', () => {
    expect(canManageUser(mockUser('admin'), null)).toBe(false);
  });

  it('returns false when both are null', () => {
    expect(canManageUser(null, null)).toBe(false);
  });

  it('user cannot manage themselves', () => {
    const user = mockUser('owner', { id: 'same-id' });
    const target = mockUser('cashier', { id: 'same-id', organization_id: 'org-1' });
    expect(canManageUser(user, target)).toBe(false);
  });

  it('owner can manage cashier in same org', () => {
    const owner = mockUser('owner', { id: 'owner-1', organization_id: 'org-1' });
    const cashier = mockUser('cashier', { id: 'cashier-1', organization_id: 'org-1' });
    expect(canManageUser(owner, cashier)).toBe(true);
  });

  it('owner can manage collaborator in same org', () => {
    const owner = mockUser('owner', { id: 'owner-1', organization_id: 'org-1' });
    const collab = mockUser('collaborator', { id: 'collab-1', organization_id: 'org-1' });
    expect(canManageUser(owner, collab)).toBe(true);
  });

  it('owner cannot manage another owner', () => {
    const owner1 = mockUser('owner', { id: 'owner-1', organization_id: 'org-1' });
    const owner2 = mockUser('owner', { id: 'owner-2', organization_id: 'org-1' });
    expect(canManageUser(owner1, owner2)).toBe(false);
  });

  it('owner cannot manage admin', () => {
    const owner = mockUser('owner', { id: 'owner-1', organization_id: 'org-1' });
    const admin = mockUser('admin', { id: 'admin-1', organization_id: 'org-1' });
    expect(canManageUser(owner, admin)).toBe(false);
  });

  it('owner cannot manage user in different org', () => {
    const owner = mockUser('owner', { id: 'owner-1', organization_id: 'org-1' });
    const cashier = mockUser('cashier', { id: 'cashier-1', organization_id: 'org-2' });
    expect(canManageUser(owner, cashier)).toBe(false);
  });

  it('collaborator cannot manage anyone', () => {
    const collab = mockUser('collaborator', { id: 'collab-1', organization_id: 'org-1' });
    const cashier = mockUser('cashier', { id: 'cashier-1', organization_id: 'org-1' });
    expect(canManageUser(collab, cashier)).toBe(false);
  });

  it('cashier cannot manage anyone', () => {
    const cashier1 = mockUser('cashier', { id: 'cashier-1', organization_id: 'org-1' });
    const cashier2 = mockUser('cashier', { id: 'cashier-2', organization_id: 'org-1' });
    expect(canManageUser(cashier1, cashier2)).toBe(false);
  });

  it('final_user cannot manage anyone', () => {
    const finalUser = mockUser('final_user', { id: 'fu-1' });
    const cashier = mockUser('cashier', { id: 'cashier-1' });
    expect(canManageUser(finalUser, cashier)).toBe(false);
  });
});

describe('getAssignableRoles', () => {
  it('admin can assign all roles', () => {
    const admin = mockUser('admin');
    const roles = getAssignableRoles(admin);
    expect(roles).toEqual([
      'final_user',
      'cashier',
      'owner',
      'collaborator',
      'admin',
    ]);
  });

  it('owner can assign cashier and collaborator', () => {
    const owner = mockUser('owner');
    const roles = getAssignableRoles(owner);
    expect(roles).toEqual(['cashier', 'collaborator']);
  });

  it('collaborator gets empty array', () => {
    expect(getAssignableRoles(mockUser('collaborator'))).toEqual([]);
  });

  it('cashier gets empty array', () => {
    expect(getAssignableRoles(mockUser('cashier'))).toEqual([]);
  });

  it('final_user gets empty array', () => {
    expect(getAssignableRoles(mockUser('final_user'))).toEqual([]);
  });

  it('null user gets empty array', () => {
    expect(getAssignableRoles(null)).toEqual([]);
  });

  it('undefined user gets empty array', () => {
    expect(getAssignableRoles(undefined)).toEqual([]);
  });
});
