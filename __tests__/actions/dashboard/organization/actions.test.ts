jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  maybeSingle: jest.fn(() => ({ data: null, error: null })),
  single: jest.fn(() => ({ data: { id: '1', name: 'Test Org' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1', email: 'test@test.com' } },
      error: null,
    })),
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, role: { name: 'owner' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => false),
  hasOwnerPermissions: jest.fn(() => true),
}));

import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizations,
  getOrganization,
  getOrganizationProducts,
  getOrganizationSettings,
  getOrganizationAddress,
  updateOrganizationVisibility,
  updateClubProfile,
} from '@/actions/dashboard/organization/actions';
import { hasOwnerPermissions, isAdmin } from '@/lib/auth/roles';
import { getCurrentUser } from '@/lib/auth/get-current-user';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.limit.mockReturnValue(mockSupabase);
  mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Org' }, error: null });
  (isAdmin as jest.Mock).mockReturnValue(false);
});

const validOrg = { name: 'My Org' };

describe('createOrganization', () => {
  it('should create org, fetch user, create app_user_organization for non-admin', async () => {
    // single() calls: 1) org insert, 2) app_user lookup, 3) getCurrentUser internal
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null }) // org insert
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'owner' } }, error: null }); // app_user lookup
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);

    const result = await createOrganization(validOrg);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createOrganization({ name: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should throw on org insert error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Insert failed' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Insert failed');
  });

  it('should throw and cleanup when auth fails', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1' }, error: null });
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: { message: 'Auth error' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Not authenticated');
    // Verify cleanup: delete org
    expect(mockSupabase.delete).toHaveBeenCalled();
  });

  it('should throw and cleanup when app_user not found', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null }) // org insert
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } }); // app_user lookup
    await expect(createOrganization(validOrg)).rejects.toThrow('Could not resolve app user');
  });

  it('should skip app_user_organization for admin users', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'admin' } }, error: null });
    const result = await createOrganization(validOrg);
    expect(result.data).toBeDefined();
  });

  it('should throw and cleanup when membership insert fails for non-admin', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'owner' } }, error: null });
    // First insert (org creation) needs to chain, second insert (membership) should fail
    mockSupabase.insert
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: { message: 'Membership failed' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Membership failed');
  });

  it('should use fallback message when membership error has empty message', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'owner' } }, error: null });
    mockSupabase.insert
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: { message: '' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Failed to associate user to organization');
  });
});

describe('createOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/organization.schema').OrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createOrganization({ name: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/organization.schema').OrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateOrganization('1', { name: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('createOrganization - data null but no error', () => {
  it('should throw when org insert returns null data without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    await expect(createOrganization(validOrg)).rejects.toThrow('Failed to create organization');
  });
});

describe('updateOrganization - data null but no error', () => {
  it('should throw when update returns null data without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    await expect(updateOrganization('1', validOrg)).rejects.toThrow('Failed to update organization');
  });
});

describe('updateOrganization', () => {
  it('should update org successfully', async () => {
    const result = await updateOrganization('1', validOrg);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateOrganization('1', { name: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should throw on update failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Update failed' } });
    await expect(updateOrganization('1', validOrg)).rejects.toThrow('Update failed');
  });
});

describe('deleteOrganization', () => {
  it('should delete org successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteOrganization('1');
    expect(result.error).toBeNull();
  });
});

describe('getOrganizations', () => {
  it('should return organizations', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getOrganizations();
    expect(result.data).toEqual([{ id: '1' }]);
  });
});

describe('getOrganization', () => {
  it('should return org by id', async () => {
    const result = await getOrganization('1');
    expect(result.data).toBeDefined();
  });
});

describe('getOrganizationProducts', () => {
  it('should return products for org', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1', name: 'Product' }], error: null });
    const result = await getOrganizationProducts('1');
    expect(result.data).toEqual([{ id: '1', name: 'Product' }]);
  });
});

describe('getOrganizationSettings', () => {
  it('should return organization settings', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Org', is_public: true }, error: null });
    const result = await getOrganizationSettings('1');
    expect(result.data).toEqual({ id: '1', name: 'Test Org', is_public: true });
    expect(result.error).toBeNull();
  });

  it('should return error when org not found', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getOrganizationSettings('999');
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'Not found' });
  });
});

describe('getOrganizationAddress', () => {
  it('returns the first address of the organization', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: { id: 7, street: 'Belgrano' }, error: null });
    expect(await getOrganizationAddress('1')).toEqual({
      data: { id: 7, street: 'Belgrano' },
      error: null,
    });
  });
});

describe('updateOrganizationVisibility', () => {
  it('should update visibility for admin user', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'admin' } });
    mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Org', is_public: true }, error: null });
    const result = await updateOrganizationVisibility('1', true);
    expect(result).toEqual({ data: { id: '1', name: 'Test Org', is_public: true }, error: null });
  });

  it('should update visibility for non-admin with membership', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'owner' } });
    // First single() call is the membership check, second is the update
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 10 }, error: null }) // membership found
      .mockReturnValueOnce({ data: { id: '1', name: 'Test Org', is_public: false }, error: null }); // update
    const result = await updateOrganizationVisibility('1', false);
    expect(result).toEqual({ data: { id: '1', name: 'Test Org', is_public: false }, error: null });
  });

  it('should return forbidden for non-admin without membership', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'owner' } });
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    const result = await updateOrganizationVisibility('1', true);
    expect(result).toEqual({ error: 'Forbidden' });
  });

  it('should return not authenticated when user is null', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await updateOrganizationVisibility('1', true);
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('should return error when update fails', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, role: { name: 'admin' } });
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Update failed' } });
    const result = await updateOrganizationVisibility('1', true);
    expect(result).toEqual({ error: 'Update failed' });
  });

  it('should return invalid input for non-boolean', async () => {
    const result = await updateOrganizationVisibility('1', 'not-boolean' as unknown as boolean);
    expect(result).toEqual({ error: 'Invalid input' });
  });
});

describe('updateClubProfile', () => {
  const profile = {
    name: 'One Store',
    business_name: null,
    tax_id: null,
    description: null,
    contact_email: null,
    contact_phone: null,
    website: null,
    industry: null,
    logo_url: null,
    is_public: true,
    show_in_explore: true,
    allow_new_members: true,
    requires_approval: false,
    email_notifications: true,
    invitation_code: '  ONESTORE  ',
    welcome_message: null,
    points_label: 'puntos',
    timezone: 'America/Argentina/Buenos_Aires',
  };

  beforeEach(() => {
    (hasOwnerPermissions as jest.Mock).mockReturnValue(true);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, organization_id: 5 });
    mockSupabase.eq.mockReturnValue({ error: null });
  });

  it('trims the invitation code and saves the profile', async () => {
    const result = await updateClubProfile('5', profile);
    expect(result).toEqual({ error: null });
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ invitation_code: 'ONESTORE' }),
    );
  });

  it('stores a null code when it is blank', async () => {
    await updateClubProfile('5', { ...profile, invitation_code: '   ' });
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ invitation_code: null }),
    );
  });

  // El tipo no existe en runtime: un payload con campos de más no puede
  // escribir columnas que el formulario no ofrece (plan, trial_started_at, ...).
  it('ignores fields outside the club-profile allowlist', async () => {
    await updateClubProfile('5', {
      ...profile,
      plan: 'pro',
      trial_started_at: '2020-01-01',
    } as unknown as Parameters<typeof updateClubProfile>[1]);

    const written = (mockSupabase.update as jest.Mock).mock.calls.at(-1)?.[0];
    expect(written).not.toHaveProperty('plan');
    expect(written).not.toHaveProperty('trial_started_at');
    expect(written).toHaveProperty('name', 'One Store');
  });

  it('rejects a payload that does not match the club profile', async () => {
    const result = await updateClubProfile(
      '5',
      { name: '' } as unknown as Parameters<typeof updateClubProfile>[1],
    );
    expect(result).toEqual({ error: 'Invalid club profile' });
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('refuses a user without owner permissions', async () => {
    (hasOwnerPermissions as jest.Mock).mockReturnValueOnce(false);
    expect(await updateClubProfile('5', profile)).toEqual({ error: 'Not authorized' });
  });

  it('refuses an unauthenticated user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
    expect(await updateClubProfile('5', profile)).toEqual({ error: 'Not authorized' });
  });

  it('refuses editing another organization', async () => {
    expect(await updateClubProfile('9', profile)).toEqual({ error: 'Not authorized' });
  });

  it('surfaces a database error', async () => {
    mockSupabase.eq.mockReturnValueOnce({ error: { message: 'boom' } });
    expect(await updateClubProfile('5', profile)).toEqual({ error: 'boom' });
  });

  // organization_name_unique: el 23505 se traduce a un mensaje para el usuario.
  it('translates the unique-name violation', async () => {
    mockSupabase.eq.mockReturnValueOnce({ error: { code: '23505', message: 'duplicate key' } });
    expect(await updateClubProfile('5', profile)).toEqual({
      error: 'Ya existe una empresa con ese nombre. Probá con otro.',
    });
  });

  const address = {
    street: 'Belgrano',
    number: '10',
    city: 'Mendoza',
    state: 'Mendoza',
    zip_code: '5500',
    country: null,
    place_id: null,
    latitude: null,
    longitude: null,
  };

  it('updates the address the organization already has', async () => {
    mockSupabase.eq
      .mockReturnValueOnce({ error: null })
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    mockSupabase.maybeSingle.mockReturnValue({ data: { id: 7 }, error: null });

    expect(await updateClubProfile('5', { ...profile, address })).toEqual({ error: null });
    expect(mockSupabase.from).toHaveBeenCalledWith('address');
    expect(mockSupabase.update).toHaveBeenLastCalledWith(address);
  });

  it('creates the address when the organization has none', async () => {
    mockSupabase.eq.mockReturnValueOnce({ error: null }).mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValueOnce({ error: null });

    expect(await updateClubProfile('5', { ...profile, address })).toEqual({ error: null });
    expect(mockSupabase.insert).toHaveBeenCalledWith({ ...address, organization_id: 5 });
  });

  it('surfaces an address error', async () => {
    mockSupabase.eq.mockReturnValueOnce({ error: null }).mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValueOnce({ error: { message: 'address boom' } });

    expect(await updateClubProfile('5', { ...profile, address })).toEqual({
      error: 'address boom',
    });
  });
});

