const maybeSingle = jest.fn();
const update = jest.fn();
const updateEq = jest.fn();

const supabase = {
  from: jest.fn((table: string) => {
    if (table === 'branch') {
      const builder: Record<string, unknown> = {};
      Object.assign(builder, { select: () => builder, eq: () => builder, maybeSingle });
      return builder;
    }
    const builder: Record<string, unknown> = {};
    Object.assign(builder, {
      update: (...args: unknown[]) => { update(...args); return builder; },
      eq: (...args: unknown[]) => { updateEq(...args); return builder; },
      then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
    });
    return builder;
  }),
};

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve(supabase)) }));
jest.mock('@/lib/auth/require-user', () => ({ requireUser: jest.fn(() => Promise.resolve({ id: '1' })) }));
const getMutationOrgId = jest.fn(() => Promise.resolve(1 as number | null));
jest.mock('@/lib/auth/get-mutation-org-id', () => ({
  getMutationOrgId: (...args: unknown[]) => getMutationOrgId(...args),
}));

import { assignCashierToBranch } from '@/actions/dashboard/branch/assign-cashier';

describe('assignCashierToBranch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMutationOrgId.mockResolvedValue(1);
    maybeSingle.mockResolvedValue({ data: { id: 3 }, error: null });
  });

  it('assigns the cashier to a branch of the same organization', async () => {
    const result = await assignCashierToBranch('5', '3');
    expect(result.error).toBeNull();
    expect(update).toHaveBeenCalledWith({ branch_id: 3 });
    expect(updateEq).toHaveBeenCalledWith('id', '5');
    expect(updateEq).toHaveBeenCalledWith('organization_id', 1);
  });

  it('clears the assignment without looking up a branch', async () => {
    const result = await assignCashierToBranch('5', null);
    expect(result.error).toBeNull();
    expect(update).toHaveBeenCalledWith({ branch_id: null });
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it('refuses a branch from another organization', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const result = await assignCashierToBranch('5', '3');
    expect(result.error).toEqual({ message: 'BRANCH_NOT_FOUND' });
    expect(update).not.toHaveBeenCalled();
  });

  it('surfaces a lookup error', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await assignCashierToBranch('5', '3')).toEqual({ error: { message: 'boom' } });
  });

  // Liberar la sucursal (branchId null) se saltea el chequeo de sucursal, así
  // que el guard de organización sigue haciendo falta en esa rama.
  it('requires an active organization when unassigning', async () => {
    getMutationOrgId.mockResolvedValue(null);
    expect(await assignCashierToBranch('5', null)).toEqual({
      error: { message: 'Missing active organization' },
    });
  });

  it('requires an active organization', async () => {
    getMutationOrgId.mockResolvedValue(null);
    expect(await assignCashierToBranch('5', '3')).toEqual({
      error: { message: 'Missing active organization' },
    });
  });

  it('surfaces an update error', async () => {
    supabase.from.mockImplementationOnce(() => {
      const builder: Record<string, unknown> = {};
      Object.assign(builder, { select: () => builder, eq: () => builder, maybeSingle });
      return builder;
    });
    supabase.from.mockImplementationOnce(() => {
      const builder: Record<string, unknown> = {};
      Object.assign(builder, {
        update: () => builder,
        eq: () => builder,
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ error: { message: 'nope' } }).then(resolve),
      });
      return builder;
    });
    expect(await assignCashierToBranch('5', '3')).toEqual({ error: { message: 'nope' } });
  });
});
