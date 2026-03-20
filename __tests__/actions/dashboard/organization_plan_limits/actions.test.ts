import {
  createOrganizationPlanLimit,
  updateOrganizationPlanLimit,
  deleteOrganizationPlanLimit,
  getOrganizationPlanLimits,
  getOrganizationPlanLimit,
} from '@/actions/dashboard/organization_plan_limits/actions';

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
  plan: 'advance' as const,
  feature: 'beneficiaries' as const,
  limit_value: 100,
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

describe('createOrganizationPlanLimit', () => {
  it('should create a record successfully', async () => {
    const result = await createOrganizationPlanLimit(validInput);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_plan_limits');
    expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
      organization_id: 'org-123',
      plan: 'advance',
      feature: 'beneficiaries',
      limit_value: 100,
    })]);
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return validation error when organization_id is missing', async () => {
    const invalidInput = { ...validInput, organization_id: '' };
    const result = await createOrganizationPlanLimit(invalidInput);
    expect(result.error).toBeDefined();
    expect((result as any).error.fieldErrors.organization_id).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return supabase error on insert failure', async () => {
    const supabaseError = { message: 'Insert failed', code: '23505' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await createOrganizationPlanLimit(validInput);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('updateOrganizationPlanLimit', () => {
  it('should update a record successfully', async () => {
    const result = await updateOrganizationPlanLimit('1', validInput);
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_plan_limits');
    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
      organization_id: 'org-123',
      plan: 'advance',
    }));
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return validation error when organization_id is missing', async () => {
    const invalidInput = { ...validInput, organization_id: '' };
    const result = await updateOrganizationPlanLimit('1', invalidInput);
    expect(result.error).toBeDefined();
    expect((result as any).error.fieldErrors.organization_id).toBeDefined();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return supabase error on update failure', async () => {
    const supabaseError = { message: 'Update failed', code: '42501' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await updateOrganizationPlanLimit('1', validInput);
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('deleteOrganizationPlanLimit', () => {
  it('should delete a record successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });

    const result = await deleteOrganizationPlanLimit('1');
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_plan_limits');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
  });

  it('should return supabase error on delete failure', async () => {
    const supabaseError = { message: 'Delete failed', code: '42501' };
    mockSupabase.eq.mockReturnValue({ error: supabaseError });

    const result = await deleteOrganizationPlanLimit('1');
    expect(result.error).toEqual(supabaseError);
  });
});

describe('getOrganizationPlanLimits', () => {
  it('should return all records successfully', async () => {
    const mockData = [{ id: '1', organization_id: 'org-1', feature: 'beneficiaries' }];
    mockSupabase.order.mockReturnValueOnce(mockSupabase).mockReturnValueOnce({ data: mockData, error: null });

    const result = await getOrganizationPlanLimits();
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_plan_limits');
    expect(mockSupabase.select).toHaveBeenCalledWith('*, organization:organization_id(name)');
    expect(mockSupabase.order).toHaveBeenCalledWith('organization_id');
    expect(mockSupabase.order).toHaveBeenCalledWith('feature');
  });

  it('should return supabase error on fetch failure', async () => {
    const supabaseError = { message: 'Fetch failed', code: '42501' };
    mockSupabase.order.mockReturnValueOnce(mockSupabase).mockReturnValueOnce({ data: null, error: supabaseError });

    const result = await getOrganizationPlanLimits();
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});

describe('getOrganizationPlanLimit', () => {
  it('should return a single record successfully', async () => {
    const mockData = { id: '1', organization_id: 'org-1', feature: 'beneficiaries' };
    mockSupabase.single.mockReturnValue({ data: mockData, error: null });

    const result = await getOrganizationPlanLimit('1');
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeNull();
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_plan_limits');
    expect(mockSupabase.select).toHaveBeenCalledWith('*, organization:organization_id(name)');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.single).toHaveBeenCalled();
  });

  it('should return supabase error on fetch failure', async () => {
    const supabaseError = { message: 'Not found', code: 'PGRST116' };
    mockSupabase.single.mockReturnValue({ data: null, error: supabaseError });

    const result = await getOrganizationPlanLimit('999');
    expect(result.data).toBeNull();
    expect(result.error).toEqual(supabaseError);
  });
});
