jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/organization/actions', () => ({
  createOrganization: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateOrganization: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { organizationFormAction } from '@/actions/dashboard/organization/organization-form-actions';
import { createOrganization, updateOrganization } from '@/actions/dashboard/organization/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('organizationFormAction', () => {
  it('should create organization successfully', async () => {
    const fd = createFormData({ name: 'My Org' });
    const result = await organizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(createOrganization).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/organization');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(result.status).toBe('success');
  });

  it('should update organization successfully', async () => {
    const fd = createFormData({ id: '1', name: 'Updated Org' });
    const result = await organizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateOrganization).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ name: '' });
    const result = await organizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createOrganization as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ name: 'Org' });
    const result = await organizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  // Regresion: `createOrganization` NO tira, devuelve { data, error }. Sin el chequeo, un
  // INSERT fallado seguia de largo y el form contestaba "guardado con exito".
  it('reporta el error del insert en vez de fingir exito', async () => {
    (createOrganization as jest.Mock).mockReturnValue({
      data: null,
      error: { message: 'duplicate key value violates unique constraint', code: '23505' },
    });
    const fd = createFormData({ name: 'My Org' });
    const result = await organizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('db.duplicate');
  });
});
