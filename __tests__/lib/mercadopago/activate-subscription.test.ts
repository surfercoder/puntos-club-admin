const mockUpdate = jest.fn();
jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn(() => ({ update: mockUpdate })),
}));
jest.mock('@/lib/mercadopago/client', () => ({ getMercadoPagoClient: jest.fn(() => ({})) }));

import { activateSubscription } from '@/lib/mercadopago/activate-subscription';

function makeAdmin(others: { id: number; mp_preapproval_id: string }[] | null) {
  const updates: { table: string; payload: unknown; id: unknown; is?: [string, unknown] }[] = [];
  const admin = {
    from: jest.fn((table: string) => ({
      update: (payload: unknown) => ({
        eq: (_col: string, id: unknown) => {
          const entry: (typeof updates)[number] = { table, payload, id };
          updates.push(entry);
          return Object.assign(Promise.resolve({}), {
            is: (col: string, value: unknown) => {
              entry.is = [col, value];
              return Promise.resolve({});
            },
          });
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
    expect(updates[2]).toEqual({
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

    expect(updates).toHaveLength(2); // only the org plan + promo
  });

  it('handles an org with no other preapprovals', async () => {
    const { admin, updates } = makeAdmin(null);

    await activateSubscription(admin, { organizationId: 3, plan: 'pro', preapprovalId: 'p' });

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(updates).toHaveLength(2);
  });

  it('starts the 12-month promo only when the org has none yet', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-19T12:00:00Z'));
    const { admin, updates } = makeAdmin(null);

    await activateSubscription(admin, { organizationId: 3, plan: 'pro', preapprovalId: 'p' });
    jest.useRealTimers();

    expect(updates[1]).toEqual({
      table: 'organization',
      payload: { promo_ends_at: '2027-10-19T12:00:00.000Z' },
      id: 3,
      is: ['promo_ends_at', null],
    });
  });
});
