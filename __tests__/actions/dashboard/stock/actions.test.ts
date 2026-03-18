jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

const mockCookieStore = {
  get: jest.fn((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  }),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({
    data: { id: '1', branch: { organization_id: 123 } },
    error: null,
  })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createStock,
  updateStock,
  deleteStock,
  getStocks,
  getStock,
} from '@/actions/dashboard/stock/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockImplementation((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  });
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({
    data: { id: '1', branch: { organization_id: 123 } },
    error: null,
  });
});

const validStock = { branch_id: '10', product_id: '20', quantity: 50, minimum_quantity: 5 };

describe('createStock', () => {
  it('should create stock successfully', async () => {
    const result = await createStock(validStock);
    expect(mockSupabase.from).toHaveBeenCalledWith('stock');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ branch_id: '10', product_id: '20' }),
    ]);
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createStock({ branch_id: '', product_id: '', quantity: 0, minimum_quantity: 0 });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await createStock(validStock);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('createStock - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/stock.schema').StockSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createStock({ branch_id: '', product_id: '', quantity: 0, minimum_quantity: 0 });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateStock - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/stock.schema').StockSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateStock('1', { branch_id: '', product_id: '', quantity: 0, minimum_quantity: 0 });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateStock', () => {
  it('should update stock successfully', async () => {
    // First call: fetch stock for org check, second: update
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', branch: { organization_id: 123 } }, error: null })
      .mockReturnValueOnce({ data: { id: '1', quantity: 100 }, error: null });
    const result = await updateStock('1', validStock);
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateStock('1', { branch_id: '', product_id: '', quantity: 0, minimum_quantity: 0 });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when stock not found', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await updateStock('999', validStock);
    expect(result.error).toEqual({ message: 'Not found' });
  });

  it('should return error when stock fetch returns null without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    const result = await updateStock('999', validStock);
    expect(result.error).toEqual({ message: 'Stock not found' });
  });

  it('should return unauthorized error when org mismatch', async () => {
    mockSupabase.single.mockReturnValueOnce({
      data: { id: '1', branch: { organization_id: 999 } },
      error: null,
    });
    const result = await updateStock('1', validStock);
    expect(result.error).toEqual({ message: 'Unauthorized: Stock belongs to a different organization' });
  });

  it('should skip org check when no active org cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', branch: { organization_id: 999 } }, error: null })
      .mockReturnValueOnce({ data: { id: '1', quantity: 100 }, error: null });
    const result = await updateStock('1', validStock);
    expect(result.data).toBeDefined();
  });
});

describe('deleteStock', () => {
  it('should delete stock successfully', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', branch: { organization_id: 123 } },
      error: null,
    });
    // First eq is for the fetch query (.eq('id', id) before .single()), needs to chain
    // Second eq is for the delete query (.delete().eq('id', id)), terminal
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    const result = await deleteStock('1');
    expect(result.error).toBeNull();
  });

  it('should return error when stock not found', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await deleteStock('999');
    expect(result.error).toEqual({ message: 'Not found' });
  });

  it('should return error when stock fetch returns null without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    const result = await deleteStock('999');
    expect(result.error).toEqual(new Error('Stock not found'));
  });

  it('should return unauthorized error when org mismatch', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', branch: { organization_id: 999 } },
      error: null,
    });
    const result = await deleteStock('1');
    expect(result.error).toEqual(new Error('Unauthorized: Stock belongs to a different organization'));
  });
});

describe('deleteStock - skip org check', () => {
  it('should skip org check when no active org cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.single.mockReturnValue({
      data: { id: '1', branch: { organization_id: 999 } },
      error: null,
    });
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // fetch .eq('id', id)
      .mockReturnValueOnce({ error: null }); // delete .eq('id', id)
    const result = await deleteStock('1');
    expect(result.error).toBeNull();
  });
});

describe('getStocks', () => {
  it('should return filtered stocks', async () => {
    mockSupabase.select.mockReturnValue({
      data: [
        { id: '1', branch: { organization_id: 123 } },
        { id: '2', branch: { organization_id: 999 } },
      ],
      error: null,
    });
    const result = await getStocks();
    expect(result.data).toEqual([{ id: '1', branch: { organization_id: 123 } }]);
    expect(result.error).toBeNull();
  });

  it('should return all stocks when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const allStocks = [{ id: '1', branch: { organization_id: 123 } }];
    mockSupabase.select.mockReturnValue({ data: allStocks, error: null });
    const result = await getStocks();
    expect(result.data).toEqual(allStocks);
  });

  it('should return error on supabase failure', async () => {
    mockSupabase.select.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getStocks();
    expect(result).toEqual({ data: null, error: { message: 'Error' } });
  });
});

describe('getStock', () => {
  it('should return a stock by id', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', branch: { organization_id: 123 } },
      error: null,
    });
    const result = await getStock('1');
    expect(result.data).toEqual({ id: '1', branch: { organization_id: 123 } });
    expect(result.error).toBeNull();
  });

  it('should return error when not found', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getStock('999');
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('should return error when data is null without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    const result = await getStock('999');
    expect(result.data).toBeNull();
    expect(result.error).toEqual(new Error('Stock not found'));
  });

  it('should return unauthorized error when org mismatch', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', branch: { organization_id: 999 } },
      error: null,
    });
    const result = await getStock('1');
    expect(result.data).toBeNull();
    expect(result.error).toEqual(new Error('Unauthorized: Stock belongs to a different organization'));
  });

  it('should skip org check when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.single.mockReturnValue({
      data: { id: '1', branch: { organization_id: 999 } },
      error: null,
    });
    const result = await getStock('1');
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});
