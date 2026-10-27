import {
  markPlatformMessagesRead,
  sendPlatformBroadcastAction,
  sendPlatformMessageAction,
} from '@/actions/dashboard/platform/actions';
import { EMPTY_ACTION_STATE } from '@/lib/action-state';

const mockRequireUser = jest.fn();
jest.mock('@/lib/auth/require-user', () => ({ requireUser: () => mockRequireUser() }));

const mockActiveOrg = jest.fn();
jest.mock('@/lib/auth/get-active-org-id', () => ({ getActiveOrgIdFilter: () => mockActiveOrg() }));

const mockPushAll = jest.fn();
jest.mock('@/lib/push', () => ({ pushToAllBeneficiaries: (...a: unknown[]) => mockPushAll(...a) }));

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockFrom = jest.fn();
const mockRpc = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: mockFrom, rpc: mockRpc }),
}));

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'insert']) c[m] = jest.fn(() => c);
  c.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return c;
}

const admin = { id: '18', role: { name: 'admin' } };
const owner = { id: '7', role: { name: 'owner' } };

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};

beforeEach(() => {
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockPushAll.mockReset();
});

describe('sendPlatformMessageAction', () => {
  it('el owner escribe en el hilo de su org activa', async () => {
    mockRequireUser.mockResolvedValue(owner);
    mockActiveOrg.mockResolvedValue(5);
    const insert = chain({ error: null });
    mockFrom.mockReturnValue(insert);

    const state = await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: ' hola ', organization_id: '99' }));

    expect(state.status).toBe('success');
    expect(insert.insert).toHaveBeenCalledWith([
      { organization_id: 5, sender_id: 7, from_platform: false, body: 'hola' },
    ]);
  });

  it('el owner sin org activa recibe error', async () => {
    mockRequireUser.mockResolvedValue(owner);
    mockActiveOrg.mockResolvedValue(null);
    const state = await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: 'hola' }));
    expect(state).toMatchObject({ status: 'error', message: 'organization.noActive' });
  });

  it('el superadmin escribe a una org', async () => {
    mockRequireUser.mockResolvedValue(admin);
    const insert = chain({ error: null });
    mockFrom.mockReturnValue(insert);
    await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: 'hola', organization_id: '3' }));
    expect(insert.insert).toHaveBeenCalledWith([
      { organization_id: 3, sender_id: 18, from_platform: true, body: 'hola' },
    ]);
  });

  it('el superadmin escribe a todas', async () => {
    mockRequireUser.mockResolvedValue(admin);
    const orgs = chain({ data: [{ id: 1 }, { id: 2 }], error: null });
    const insert = chain({ error: null });
    mockFrom.mockReturnValueOnce(orgs).mockReturnValueOnce(insert);
    await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: 'hola', organization_id: 'all' }));
    expect(insert.insert).toHaveBeenCalledWith([
      expect.objectContaining({ organization_id: 1 }),
      expect.objectContaining({ organization_id: 2 }),
    ]);
  });

  it('propaga el error al listar organizaciones', async () => {
    mockRequireUser.mockResolvedValue(admin);
    mockFrom.mockReturnValue(chain({ data: null, error: { code: '42501' } }));
    const state = await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: 'hola', organization_id: 'all' }));
    expect(state).toMatchObject({ status: 'error', message: 'db.forbidden' });
  });

  it('rechaza una org invalida', async () => {
    mockRequireUser.mockResolvedValue(admin);
    const state = await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: 'hola', organization_id: 'x' }));
    expect(state.message).toBe('organization.noActive');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('valida el cuerpo vacio', async () => {
    mockRequireUser.mockResolvedValue(owner);
    const state = await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: '   ' }));
    expect(state.fieldErrors.body).toEqual(['bodyRequired']);
  });

  it('propaga el error del insert (RLS)', async () => {
    mockRequireUser.mockResolvedValue(owner);
    mockActiveOrg.mockResolvedValue(5);
    mockFrom.mockReturnValue(chain({ error: { code: '42501' } }));
    const state = await sendPlatformMessageAction(EMPTY_ACTION_STATE, form({ body: 'hola' }));
    expect(state.message).toBe('db.forbidden');
  });
});

describe('markPlatformMessagesRead', () => {
  it('llama a la RPC con la org', async () => {
    mockRpc.mockResolvedValue({});
    await markPlatformMessagesRead(4);
    expect(mockRpc).toHaveBeenCalledWith('mark_platform_messages_read', { p_org: 4 });
  });
});

describe('sendPlatformBroadcastAction', () => {
  it('solo el superadmin', async () => {
    mockRequireUser.mockResolvedValue(owner);
    const state = await sendPlatformBroadcastAction(EMPTY_ACTION_STATE, form({ title: 't', body: 'b' }));
    expect(state.message).toBe('db.forbidden');
    expect(mockPushAll).not.toHaveBeenCalled();
  });

  it('valida titulo y mensaje', async () => {
    mockRequireUser.mockResolvedValue(admin);
    const state = await sendPlatformBroadcastAction(EMPTY_ACTION_STATE, form({ title: '', body: 'x'.repeat(241) }));
    expect(state.fieldErrors).toEqual({ title: ['titleRequired'], body: ['bodyTooLong'] });
  });

  it('manda el push y guarda el historial', async () => {
    mockRequireUser.mockResolvedValue(admin);
    mockPushAll.mockResolvedValue({ sent: 3, failed: 1 });
    const insert = chain({ error: null });
    mockFrom.mockReturnValue(insert);

    const state = await sendPlatformBroadcastAction(EMPTY_ACTION_STATE, form({ title: 'Nueva versión', body: 'Actualizá' }));

    expect(mockPushAll).toHaveBeenCalledWith({
      title: 'Nueva versión',
      body: 'Actualizá',
      data: { type: 'platform_broadcast' },
    });
    expect(insert.insert).toHaveBeenCalledWith({
      created_by: 18, title: 'Nueva versión', body: 'Actualizá', sent_count: 3, failed_count: 1,
    });
    expect(state).toMatchObject({ status: 'success', message: 'platformBroadcastSent' });
  });

  it('propaga el error al guardar el historial', async () => {
    mockRequireUser.mockResolvedValue(admin);
    mockPushAll.mockResolvedValue({ sent: 0, failed: 0 });
    mockFrom.mockReturnValue(chain({ error: { code: '23514' } }));
    const state = await sendPlatformBroadcastAction(EMPTY_ACTION_STATE, form({ title: 't', body: 'b' }));
    expect(state.message).toBe('db.invalidValue');
  });
});
