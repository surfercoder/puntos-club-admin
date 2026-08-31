const assignCashierToBranch = jest.fn(() => Promise.resolve({ error: null }));
const checkBranchInActiveOrg = jest.fn(() => Promise.resolve({ error: null }));
jest.mock('@/actions/dashboard/branch/assign-cashier', () => ({
  assignCashierToBranch: (...args: unknown[]) => assignCashierToBranch(...args),
  checkBranchInActiveOrg: (...args: unknown[]) => checkBranchInActiveOrg(...args),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/app_user/actions', () => ({
  createAppUser: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateAppUser: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { appUserFormAction } from '@/actions/dashboard/app_user/app_user-form-actions';
import { createAppUser, updateAppUser } from '@/actions/dashboard/app_user/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('appUserFormAction', () => {
  it('should create app user successfully', async () => {
    const fd = createFormData({ email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAppUser).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/app_user');
    expect(result.status).toBe('success');
  });

  it('should update app user successfully', async () => {
    const fd = createFormData({ id: '1', email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateAppUser).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ email: 'not-an-email' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createAppUser as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error message when result.error has message', async () => {
    (createAppUser as jest.Mock).mockReturnValueOnce({ data: null, error: { message: 'Limit reached' } });
    const fd = createFormData({ email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('Limit reached');
  });

  it('should return default error message when result.error has no message property', async () => {
    (createAppUser as jest.Mock).mockReturnValueOnce({ data: null, error: { fieldErrors: { email: 'bad' } } });
    const fd = createFormData({ email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('should return default error message when result.error.message is null', async () => {
    (createAppUser as jest.Mock).mockReturnValueOnce({ data: null, error: { message: null } });
    const fd = createFormData({ email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('An unexpected error occurred');
  });
});

describe('appUserFormAction branch assignment', () => {
  function formDataOf(data: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.append(k, v);
    return fd;
  }

  const validFields = {
    role_id: '2',
    first_name: 'María',
    last_name: 'Juárez',
    email: 'maria@appcajeros.com',
    password: 'Sup3rSecret!',
  };

  beforeEach(() => {
    assignCashierToBranch.mockResolvedValue({ error: null });
    checkBranchInActiveOrg.mockResolvedValue({ error: null });
    (createAppUser as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  });

  it('assigns the branch of a newly created cashier', async () => {
    await appUserFormAction(EMPTY_ACTION_STATE, formDataOf({ ...validFields, branch_id: '3' }));
    expect(assignCashierToBranch).toHaveBeenCalledWith(expect.any(String), '3');
  });

  it('assigns the branch when editing an existing cashier', async () => {
    await appUserFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ ...validFields, id: '9', branch_id: '3' }),
    );
    expect(assignCashierToBranch).toHaveBeenCalledWith('9', '3');
  });

  it('surfaces a failed assignment', async () => {
    assignCashierToBranch.mockResolvedValueOnce({ error: { message: 'BRANCH_NOT_FOUND' } });
    const result = await appUserFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ ...validFields, branch_id: '3' }),
    );
    expect(result).toEqual({
      status: 'error',
      message: 'BRANCH_NOT_FOUND',
      fieldErrors: {},
    });
  });

  // Una sucursal de otra organización tiene que frenar ANTES del alta: si no,
  // quedan el app_user y su usuario de Auth creados y el email ya tomado.
  it('rejects a branch outside the organization without creating the user', async () => {
    checkBranchInActiveOrg.mockResolvedValueOnce({ error: { message: 'BRANCH_NOT_FOUND' } });
    const result = await appUserFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ ...validFields, branch_id: '99' }),
    );
    expect(result).toEqual({
      status: 'error',
      message: 'BRANCH_NOT_FOUND',
      fieldErrors: {},
    });
    expect(createAppUser).not.toHaveBeenCalled();
    expect(assignCashierToBranch).not.toHaveBeenCalled();
  });

  it('does nothing when the created user has no id', async () => {
    (createAppUser as jest.Mock).mockReturnValueOnce({ data: null, error: null });
    await appUserFormAction(EMPTY_ACTION_STATE, formDataOf({ ...validFields, branch_id: '3' }));
    expect(assignCashierToBranch).not.toHaveBeenCalled();
  });

  it('does nothing when the form does not include the branch field', async () => {
    await appUserFormAction(EMPTY_ACTION_STATE, formDataOf(validFields));
    expect(assignCashierToBranch).not.toHaveBeenCalled();
  });

  // Un cajero sin sucursal no puede operar: el selector vacío se rechaza y no
  // se crea ni se toca nada.
  it('rejects a cashier with no branch', async () => {
    const result = await appUserFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ ...validFields, id: '9', branch_id: '' }),
    );
    expect(result).toEqual({
      status: 'error',
      message: 'BRANCH_REQUIRED',
      fieldErrors: { branch_id: ['BRANCH_REQUIRED'] },
    });
    expect(createAppUser).not.toHaveBeenCalled();
    expect(assignCashierToBranch).not.toHaveBeenCalled();
  });
});

