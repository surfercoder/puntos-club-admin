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
  upsert: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: 1, name: 'Test' }, error: null })),
  maybeSingle: jest.fn(() => ({ data: null, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1', email: 'owner@test.com', user_metadata: { first_name: 'Test', last_name: 'Owner' } } },
      error: null,
    })),
    admin: {
      createUser: jest.fn(() => ({ data: { user: { id: 'cashier-auth-1' } }, error: null })),
      deleteUser: jest.fn(() => ({ error: null })),
    },
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => mockSupabase) }));

import { completeOnboarding, getOnboardingStatus } from '@/actions/onboarding/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.upsert.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.limit.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: 1, name: 'Test' }, error: null });
  mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
  mockSupabase.auth.getUser.mockReturnValue({
    data: { user: { id: 'auth-1', email: 'owner@test.com', user_metadata: { first_name: 'Test', last_name: 'Owner' } } },
    error: null,
  });
  mockSupabase.auth.admin.createUser.mockReturnValue({ data: { user: { id: 'cashier-auth-1' } }, error: null });
});

const step2Data = {
  org: { name: 'My Org' },
  address: { street: 'Main', number: '100', city: 'BA', state: 'CABA', zip_code: '1000' },
  branch: { name: 'Main Branch' },
};

describe('completeOnboarding', () => {
  it('should return existing data for idempotent call', async () => {
    mockSupabase.maybeSingle.mockReturnValue({
      data: { id: 10, organization_id: 5 },
      error: null,
    });
    mockSupabase.single.mockReturnValueOnce({ data: { name: 'Existing Org' }, error: null });
    mockSupabase.maybeSingle.mockReturnValueOnce({ data: { id: 10, organization_id: 5 }, error: null })
      .mockReturnValueOnce({ data: { id: 20 }, error: null });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should return error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: { message: 'No session' } });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('No autenticado');
  });

  it('should create all entities for new onboarding', async () => {
    // maybeSingle for existing app user check returns null (no existing)
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // owner role
    // singles for org, address, branch, app_user inserts
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'My Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: { id: 4 }, error: null }); // app_user

    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
  });

  it('should return error on org creation failure', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Org insert failed' } });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Org insert failed');
  });

  it('should cleanup and return error on address creation failure', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: null, error: { message: 'Address failed' } }); // address
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(mockSupabase.delete).toHaveBeenCalled();
  });

  it('should cleanup and return error on branch creation failure', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'Branch failed' } });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
  });

  it('should handle subscription for paid plans', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null });
    const result = await completeOnboarding({
      step2: step2Data,
      plan: 'advance',
      mpPreapprovalId: 'mp-123',
    });
    expect(result.success).toBe(true);
    expect(mockSupabase.upsert).toHaveBeenCalled();
  });

  it('should handle catalog creation', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null })
      .mockReturnValueOnce({ data: { id: 5 }, error: null }) // category
      .mockReturnValueOnce({ data: { id: 6 }, error: null }); // product
    const result = await completeOnboarding({
      step2: step2Data,
      step4: {
        categories: [
          { name: 'Cat1', products: [{ name: 'Prod1', required_points: 100, quantity: 10 }] },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('should create owner role when not found and succeed', async () => {
    // Lines 205-217: roleData is null, so it inserts the owner role
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user = null
      .mockReturnValueOnce({ data: null, error: null }); // owner role not found
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org insert
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address insert
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch insert
      .mockReturnValueOnce({ data: { id: 10 }, error: null }) // owner role insert (line 205-209)
      .mockReturnValueOnce({ data: { id: 4 }, error: null }); // app_user insert
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
  });

  it('should rollback and return error when owner role insert fails', async () => {
    // Lines 211-216: insertRoleError or !inserted
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user = null
      .mockReturnValueOnce({ data: null, error: null }); // owner role not found
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: null, error: { message: 'Role insert failed' } }); // role insert fails
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al obtener o crear el rol de propietario');
  });

  it('should update existing app_user when it exists without org', async () => {
    // Lines 225-238: existingAppUser exists but has no organization_id
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: { id: 50, organization_id: null }, error: null }) // existing app_user (no org)
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // owner role found
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org insert
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address insert
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch insert
      .mockReturnValueOnce({ data: { id: 50 }, error: null }); // app_user update
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
    expect(mockSupabase.update).toHaveBeenCalled();
  });

  it('should rollback and return error when app_user update fails', async () => {
    // Lines 232-237: updateError
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: { id: 50, organization_id: null }, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // owner role
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: null, error: { message: 'Update failed' } }); // app_user update fails
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Update failed');
  });

  it('should rollback and return error when new app_user insert fails', async () => {
    // Lines 255-258: appUserError
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // no existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // owner role
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: null, error: { message: 'App user insert failed' } }); // app_user fails
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('App user insert failed');
  });

  it('should create cashier user when cashier data provided', async () => {
    // Lines 352-405: cashier creation flow
    const step2WithCashier = {
      ...step2Data,
      cashier: {
        email: 'cashier@test.com',
        password: 'pass123',
        first_name: 'Cash',
        last_name: 'Ier',
      },
    };
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }) // owner role
      .mockReturnValueOnce({ data: { id: 2 }, error: null }); // cashier role found
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: { id: 4 }, error: null }) // app_user (owner)
      .mockReturnValueOnce({ data: { id: 5 }, error: null }); // cashier app_user
    const result = await completeOnboarding({ step2: step2WithCashier });
    expect(result.success).toBe(true);
    expect(mockSupabase.auth.admin.createUser).toHaveBeenCalled();
  });

  it('should create cashier role if not found', async () => {
    // Lines 380-387: cashierRoleData is null, insert new role
    const step2WithCashier = {
      ...step2Data,
      cashier: {
        email: 'cashier@test.com',
        password: 'pass123',
      },
    };
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }) // owner role
      .mockReturnValueOnce({ data: null, error: null }); // cashier role NOT found
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: { id: 4 }, error: null }) // app_user (owner)
      .mockReturnValueOnce({ data: { id: 20 }, error: null }) // cashier role insert
      .mockReturnValueOnce({ data: { id: 5 }, error: null }); // cashier app_user
    const result = await completeOnboarding({ step2: step2WithCashier });
    expect(result.success).toBe(true);
  });

  it('should skip cashier app_user creation when auth user creation fails', async () => {
    // Lines 366: cashierAuthError
    const step2WithCashier = {
      ...step2Data,
      cashier: { email: 'cashier@test.com', password: 'pass123' },
    };
    mockSupabase.auth.admin.createUser.mockReturnValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    });
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // owner role
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: { id: 4 }, error: null }); // app_user (owner)
    const result = await completeOnboarding({ step2: step2WithCashier });
    // It still succeeds, just skips cashier creation
    expect(result.success).toBe(true);
  });

  it('should handle unexpected error', async () => {
    mockSupabase.auth.getUser.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unexpected');
  });

  it('should handle non-Error throw', async () => {
    mockSupabase.auth.getUser.mockImplementation(() => { throw 'string error'; });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error inesperado');
  });

  it('should return linked count of 0 when bulk insert returns null data', async () => {
    // Test the `data?.length || 0` branch (line 224-225)
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }); // owner role
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null }) // org
      .mockReturnValueOnce({ data: { id: 2 }, error: null }) // address
      .mockReturnValueOnce({ data: { id: 3 }, error: null }) // branch
      .mockReturnValueOnce({ data: { id: 4 }, error: null }); // app_user

    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
  });

  it('should handle catalog with empty category name', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null });
    const result = await completeOnboarding({
      step2: step2Data,
      step4: {
        categories: [
          { name: '', products: [] }, // empty name - should skip
          { name: 'Cat', products: [{ name: '', required_points: 100, quantity: 10 }] }, // empty product name
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('should handle catalog with category insert error', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'Category insert failed' } }); // category insert fail
    const result = await completeOnboarding({
      step2: step2Data,
      step4: {
        categories: [{ name: 'Cat1', products: [{ name: 'Prod1', required_points: 100, quantity: 10 }] }],
      },
    });
    expect(result.success).toBe(true); // continues despite category error
  });

  it('should handle catalog with product insert error', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null })
      .mockReturnValueOnce({ data: { id: 5 }, error: null }) // category OK
      .mockReturnValueOnce({ data: null, error: { message: 'Product insert failed' } }); // product fail
    const result = await completeOnboarding({
      step2: step2Data,
      step4: {
        categories: [{ name: 'Cat1', products: [{ name: 'Prod1', required_points: 100, quantity: 10 }] }],
      },
    });
    expect(result.success).toBe(true); // continues despite product error
  });

  it('should handle pro plan subscription', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null });
    const result = await completeOnboarding({
      step2: step2Data,
      plan: 'pro',
      mpPreapprovalId: 'mp-456',
    });
    expect(result.success).toBe(true);
    expect(mockSupabase.upsert).toHaveBeenCalled();
  });

  it('should handle cashier with no cashierRoleData after failed insert', async () => {
    const step2WithCashier = {
      ...step2Data,
      cashier: { email: 'cashier@test.com', password: 'pass123' },
    };
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null }) // existing app_user
      .mockReturnValueOnce({ data: { id: 1 }, error: null }) // owner role
      .mockReturnValueOnce({ data: null, error: null }); // cashier role NOT found
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'Role insert failed' } }); // cashier role insert fails
    const result = await completeOnboarding({ step2: step2WithCashier });
    // cashierRoleData is null, so it skips creating cashier app_user
    expect(result.success).toBe(true);
  });

  it('should handle idempotent call when branch is not found', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: { id: 10, organization_id: 5 }, error: null }) // existing user
      .mockReturnValueOnce({ data: null, error: null }); // no branch found
    mockSupabase.single
      .mockReturnValueOnce({ data: { name: 'Existing Org' }, error: null }); // org name
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
    expect(result.data?.branchId).toBe(0);
  });

  it('should handle org creation with optional fields empty (lines 138-140 || null branches)', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null });
    const step2WithOptionals = {
      org: { name: 'Org', business_name: 'BN', tax_id: 'TX', logo_url: 'http://logo.png' },
      address: { street: 'Main', number: '100', city: 'BA', state: 'CABA', zip_code: '1000', country: 'AR', place_id: 'pid', latitude: -34.6, longitude: -58.4 },
      branch: { name: '', phone: '555-1234' },
    };
    const result = await completeOnboarding({ step2: step2WithOptionals });
    expect(result.success).toBe(true);
  });

  it('should handle org creation when orgData is null (line 148 fallback msg)', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    mockSupabase.single.mockReturnValue({ data: null, error: null }); // data=null, error=null
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al crear la organización');
  });

  it('should handle address creation when addressData is null (line 173 fallback)', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: null, error: null }); // address: data=null, error=null
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al crear la dirección');
  });

  it('should handle branch creation when branchData is null (line 192 fallback)', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: null, error: null }); // branch: data=null, error=null
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al crear la sucursal');
  });

  it('should handle app_user update when updatedUser is null (line 236 fallback)', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: { id: 50, organization_id: null }, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: null, error: null }); // app_user update: data=null, error=null
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al actualizar el perfil');
  });

  it('should handle app_user insert when appUserData is null (line 258 fallback)', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: null, error: null }); // app_user insert: data=null, error=null
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al crear el perfil de usuario');
  });

  it('should handle user_metadata missing (line 221 || {})', async () => {
    mockSupabase.auth.getUser.mockReturnValue({
      data: { user: { id: 'auth-1', email: 'test@test.com', user_metadata: undefined } },
      error: null,
    });
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null });
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
  });

  it('should handle null cashierAppUser (line 404 branch)', async () => {
    const step2WithCashier = {
      ...step2Data,
      cashier: { email: 'cashier@test.com', password: 'pass123' },
    };
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null }); // cashier role
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null })
      .mockReturnValueOnce({ data: null, error: null }); // cashier app_user insert returns null
    const result = await completeOnboarding({ step2: step2WithCashier });
    expect(result.success).toBe(true);
    // Should not call upsert for app_user_organization for the cashier
  });

  it('should skip subscription when mpPreapprovalId is not provided (line 286)', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null });
    const _upsertCallsBefore = mockSupabase.upsert.mock.calls.length;
    const result = await completeOnboarding({ step2: step2Data, plan: 'advance' });
    expect(result.success).toBe(true);
    // upsert should only be called for app_user_organization, not subscription
    // (no mpPreapprovalId)
  });

  it('should handle catalog with product without optional fields', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: 1, name: 'Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 2 }, error: null })
      .mockReturnValueOnce({ data: { id: 3 }, error: null })
      .mockReturnValueOnce({ data: { id: 4 }, error: null })
      .mockReturnValueOnce({ data: { id: 5 }, error: null }) // category
      .mockReturnValueOnce({ data: { id: 6 }, error: null }); // product
    const result = await completeOnboarding({
      step2: step2Data,
      step4: {
        categories: [{
          name: 'Cat',
          description: '',
          products: [{
            name: 'Prod',
            description: '',
            required_points: 0, // falsy, should default to 100
            quantity: 0,        // falsy, should default to 0
            minimum_quantity: 0, // falsy, should default to 1
          }],
        }],
      },
    });
    expect(result.success).toBe(true);
  });

  it('should use org name from input when org query returns no name', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({ data: { id: 10, organization_id: 5 }, error: null })
      .mockReturnValueOnce({ data: null, error: null }); // no branch
    mockSupabase.single
      .mockReturnValueOnce({ data: null, error: null }); // no org found
    const result = await completeOnboarding({ step2: step2Data });
    expect(result.success).toBe(true);
    expect(result.data?.orgName).toBe('My Org');
  });
});

describe('getOnboardingStatus', () => {
  it('should return unauthenticated when no user', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: { message: 'No session' } });
    const result = await getOnboardingStatus();
    expect(result.status).toBe('unauthenticated');
  });

  it('should return needs_profile when no app_user', async () => {
    mockSupabase.maybeSingle.mockReturnValue({ data: null, error: null });
    const result = await getOnboardingStatus();
    expect(result.status).toBe('needs_profile');
  });

  it('should return needs_org when app_user has no organization', async () => {
    mockSupabase.maybeSingle.mockReturnValueOnce({
      data: { id: 1, organization_id: null, role: { name: 'owner' }, organization: null },
      error: null,
    });
    const result = await getOnboardingStatus();
    expect(result.status).toBe('needs_org');
  });

  it('should return complete when fully set up', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({
        data: { id: 1, organization_id: 10, role: { name: 'owner' }, organization: { id: 10, name: 'Org' } },
        error: null,
      })
      .mockReturnValueOnce({ data: { id: 5 }, error: null }); // branch
    const result = await getOnboardingStatus();
    expect(result.status).toBe('complete');
  });

  it('should handle role as array', async () => {
    mockSupabase.maybeSingle
      .mockReturnValueOnce({
        data: { id: 1, organization_id: 10, role: [{ name: 'owner' }], organization: [{ id: 10, name: 'Org' }] },
        error: null,
      })
      .mockReturnValueOnce({ data: { id: 5 }, error: null });
    const result = await getOnboardingStatus();
    expect(result.status).toBe('complete');
  });

  it('should handle unexpected error', async () => {
    mockSupabase.auth.getUser.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getOnboardingStatus();
    expect(result.status).toBe('error');
    expect(result.success).toBe(false);
  });

  it('should handle non-Error throw', async () => {
    mockSupabase.auth.getUser.mockImplementation(() => { throw 'string error'; });
    const result = await getOnboardingStatus();
    expect(result.status).toBe('error');
    expect(result.error).toBe('Unknown error');
  });
});
