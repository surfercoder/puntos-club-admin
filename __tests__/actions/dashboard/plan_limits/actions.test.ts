import {
  createPlanLimit,
  updatePlanLimit,
  deletePlanLimit,
  getPlanLimits,
  getPlanLimit,
} from '@/actions/dashboard/plan_limits/actions';

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

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockSupabase),
}));

const validInput = {
  plan: 'advance' as const,
  feature: 'beneficiaries' as const,
  limit_value: 50,
  warning_threshold: 0.8,
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

describe('createPlanLimit', () => {
  it('should create a record successfully', async () => {
    const result = await createPlanLimit(validInput);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('plan_limits');
    expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
      plan: 'advance',
      feature: 'beneficiaries',
      limit_value: 50,
    })]);
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return validation error when plan is invalid', async () => {
    const invalidInput = { ...validInput, plan: 'invalid_plan' };
    const result = await createPlanLimit(invalidInput);
    expect(result.error).toBeDefined();
    expect((result as any).error.fieldErrors.plan).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return supabase error on insert failure', async () => {
    const supabaseError = { message: 'Insert failed', code: '23505' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await createPlanLimit(validInput);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('updatePlanLimit', () => {
  it('should update a record successfully', async () => {
    const result = await updatePlanLimit('1', validInput);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('plan_limits');
    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
      plan: 'advance',
      feature: 'beneficiaries',
    }));
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return validation error when feature is invalid', async () => {
    const invalidInput = { ...validInput, feature: 'invalid_feature' };
    const result = await updatePlanLimit('1', invalidInput);
    expect(result.error).toBeDefined();
    expect((result as any).error.fieldErrors.feature).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return supabase error on update failure', async () => {
    const supabaseError = { message: 'Update failed', code: '42501' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await updatePlanLimit('1', validInput);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('deletePlanLimit', () => {
  it('should delete a record successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });

    const result = await deletePlanLimit('1');
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('plan_limits');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
  });

  it('should return supabase error on delete failure', async () => {
    const supabaseError = { message: 'Delete failed', code: '42501' };
    mockSupabase.eq.mockReturnValue({ error: supabaseError });

    const result = await deletePlanLimit('1');
    expect(result.error).toEqual(supabaseError);
  });
});

describe('getPlanLimits', () => {
  it('should return all records successfully', async () => {
    const mockData = [{ id: '1', plan: 'advance', feature: 'beneficiaries', limit_value: 50 }];
    mockSupabase.order.mockReturnValueOnce(mockSupabase).mockReturnValueOnce({ data: mockData, error: null });

    const result = await getPlanLimits();
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('plan_limits');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.order).toHaveBeenCalledWith('plan');
    expect(mockSupabase.order).toHaveBeenCalledWith('feature');
  });

  it('should return supabase error on fetch failure', async () => {
    const supabaseError = { message: 'Fetch failed', code: '42501' };
    mockSupabase.order.mockReturnValueOnce(mockSupabase).mockReturnValueOnce({ data: null, error: supabaseError });

    const result = await getPlanLimits();
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('getPlanLimit', () => {
  it('should return a single record successfully', async () => {
    const mockData = { id: '1', plan: 'advance', feature: 'beneficiaries', limit_value: 50 };
    mockSupabase.single.mockReturnValue({ data: mockData, error: null });

    const result = await getPlanLimit('1');
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('plan_limits');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return supabase error on fetch failure', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await getPlanLimit('999');
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});
