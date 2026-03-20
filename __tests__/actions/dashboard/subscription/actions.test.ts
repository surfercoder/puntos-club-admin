import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptions,
  getSubscription,
} from '@/actions/dashboard/subscription/actions';

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1' }, error: null })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

const validInput = {
  organization_id: 'org-123',
  mp_preapproval_id: 'preapproval-abc',
  mp_plan_id: 'plan-xyz',
  plan: 'advance' as const,
  status: 'pending' as const,
  payer_email: 'test@example.com',
  amount: 1500,
  currency: 'ARS',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });
});

describe('createSubscription', () => {
  it('should create a record successfully', async () => {
    const result = await createSubscription(validInput);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('subscription');
    expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
      organization_id: 'org-123',
      mp_preapproval_id: 'preapproval-abc',
      plan: 'advance',
      payer_email: 'test@example.com',
      amount: 1500,
    })]);
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return validation error when organization_id is missing', async () => {
    const invalidInput = { ...validInput, organization_id: '' };
    const result = await createSubscription(invalidInput);
    expect(result.error).toBeDefined();
    expect((result as any).error.fieldErrors.organization_id).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return supabase error on insert failure', async () => {
    const supabaseError = { message: 'Insert failed', code: '23505' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await createSubscription(validInput);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('updateSubscription', () => {
  it('should update a record successfully', async () => {
    const result = await updateSubscription('1', validInput);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('subscription');
    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
      organization_id: 'org-123',
      plan: 'advance',
    }));
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return validation error when payer_email is invalid', async () => {
    const invalidInput = { ...validInput, payer_email: 'not-an-email' };
    const result = await updateSubscription('1', invalidInput);
    expect(result.error).toBeDefined();
    expect((result as any).error.fieldErrors.payer_email).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return supabase error on update failure', async () => {
    const supabaseError = { message: 'Update failed', code: '42501' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await updateSubscription('1', validInput);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('deleteSubscription', () => {
  it('should delete a record successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });

    const result = await deleteSubscription('1');
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('subscription');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
  });

  it('should return supabase error on delete failure', async () => {
    const supabaseError = { message: 'Delete failed', code: '42501' };
    mockSupabase.eq.mockReturnValue({ error: supabaseError });

    const result = await deleteSubscription('1');
    expect(result.error).toEqual(supabaseError);
  });
});

describe('getSubscriptions', () => {
  it('should return all records successfully', async () => {
    const mockData = [{ id: '1', organization_id: 'org-1', plan: 'advance' }];
    mockSupabase.order.mockReturnValue({ data: mockData, error: null });

    const result = await getSubscriptions();
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('subscription');
    expect(mockSupabase.select).toHaveBeenCalledWith('*, organization:organization_id(name)');
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should return supabase error on fetch failure', async () => {
    const supabaseError = { message: 'Fetch failed', code: '42501' };
    mockSupabase.order.mockReturnValue({ data: null, error: supabaseError });

    const result = await getSubscriptions();
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('getSubscription', () => {
  it('should return a single record successfully', async () => {
    const mockData = { id: '1', organization_id: 'org-1', plan: 'advance', payer_email: 'test@example.com' };
    mockSupabase.single.mockReturnValue({ data: mockData, error: null });

    const result = await getSubscription('1');
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('subscription');
    expect(mockSupabase.select).toHaveBeenCalledWith('*, organization:organization_id(name)');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return supabase error on fetch failure', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await getSubscription('999');
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});
