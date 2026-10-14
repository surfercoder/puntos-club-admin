const mockUpdate = jest.fn();
jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn(() => ({ update: mockUpdate })),
}));
jest.mock('@/lib/mercadopago/client', () => ({ getMercadoPagoClient: jest.fn(() => ({})) }));

import { activateSubscription } from '@/lib/mercadopago/activate-subscription';

function makeAdmin(others: { id: number; mp_preapproval_id: string }[] | null) {
  const updates: { table: string; payload: unknown; id: unknown }[] = [];
  const admin = {
    from: jest.fn((table: string) => ({
      update: (payload: unknown) => ({
        eq: (_col: string, id: unknown) => {
          updates.push({ table, payload, id });
          return Promise.resolve({});
        },
      }),
      select: () => ({
        eq: () => ({ neq: () => ({ neq: () => Promise.resolve({ data: others }) }) }),
      }),
    })),
  };
  return { admin: admin as never, updates };
}

describe('activateSubscription', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets the org plan, then cancels the other live preapprovals in MP and in the DB', async () => {
    mockUpdate.mockResolvedValue({});
    const { admin, updates } = makeAdmin([{ id: 9, mp_preapproval_id: 'old_pro' }]);

    await activateSubscription(admin, { organizationId: 3, plan: 'advance', preapprovalId: 'new_adv' });

    expect(updates[0]).toEqual({ table: 'organization', payload: { plan: 'advance' }, id: 3 });
    expect(mockUpdate).toHaveBeenCalledWith({ id: 'old_pro', body: { status: 'cancelled' } });
    expect(updates[1]).toEqual({
      table: 'subscription',
      payload: expect.objectContaining({ status: 'cancelled' }),
      id: 9,
    });
  });

  it('leaves the row live when MP refuses the cancellation', async () => {
    mockUpdate.mockRejectedValue(new Error('MP down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { admin, updates } = makeAdmin([{ id: 9, mp_preapproval_id: 'old_pro' }]);

    await activateSubscription(admin, { organizationId: 3, plan: 'advance', preapprovalId: 'new_adv' });

    expect(updates).toHaveLength(1); // only the org plan
  });

  it('handles an org with no other preapprovals', async () => {
    const { admin, updates } = makeAdmin(null);

    await activateSubscription(admin, { organizationId: 3, plan: 'pro', preapprovalId: 'p' });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(updates).toHaveLength(1);
  });
});
