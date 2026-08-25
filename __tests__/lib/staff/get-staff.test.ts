let userRows: unknown[] | null = [];
let branchRows: unknown[] | null = [];
let purchaseRows: unknown[] | null = [];

const makeBuilder = (settle: () => Promise<unknown>) => {
  const builder: Record<string, unknown> = {};
  Object.assign(builder, {
    select: () => builder,
    eq: () => builder,
    gte: () => Object.assign(settle(), builder),
    order: () => Object.assign(settle(), builder),
    then: (resolve: (v: unknown) => unknown) => settle().then(resolve),
  });
  return builder;
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: (table: string) => {
      if (table === 'app_user') return makeBuilder(() => Promise.resolve({ data: userRows }));
      if (table === 'branch') return makeBuilder(() => Promise.resolve({ data: branchRows }));
      return makeBuilder(() => Promise.resolve({ data: purchaseRows }));
    },
  })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1' })),
}));
const getActiveOrgIdFilter = jest.fn(() => Promise.resolve(1 as number | null));
jest.mock('@/lib/auth/get-active-org-id', () => ({
  getActiveOrgIdFilter: (...args: unknown[]) => getActiveOrgIdFilter(...args),
}));

import {
  filterStaff,
  getStaff,
  staffInitials,
  staffName,
  type StaffMember,
} from '@/lib/staff/get-staff';

const member = (over: Partial<StaffMember> = {}): StaffMember => ({
  id: '1',
  firstName: 'Ana',
  lastName: 'Diaz',
  email: 'ana@test.com',
  active: true,
  branchId: '3',
  branchName: 'Centro',
  createdAt: '2026-01-01',
  operationsThisMonth: 0,
  lastOperationAt: null,
  ...over,
});

describe('getStaff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getActiveOrgIdFilter.mockResolvedValue(1);
    userRows = [
      {
        id: 5,
        first_name: 'María',
        last_name: 'Juárez',
        email: 'maria@test.com',
        active: true,
        branch_id: 3,
        created_at: '2026-01-01',
        branch: { name: 'Centro' },
        role: { name: 'cashier' },
      },
    ];
    branchRows = [{ id: 3, name: 'Centro' }];
    purchaseRows = [
      { cashier_id: 5, purchase_date: '2026-08-01T10:00:00Z' },
      { cashier_id: 5, purchase_date: '2026-08-10T10:00:00Z' },
      { cashier_id: null, purchase_date: '2026-08-11T10:00:00Z' },
    ];
  });

  it('counts this month operations and keeps the latest one', async () => {
    const payload = await getStaff('cashier');
    expect(payload.members[0].operationsThisMonth).toBe(2);
    expect(payload.members[0].lastOperationAt).toBe('2026-08-10T10:00:00Z');
    expect(payload.branches).toEqual([{ id: '3', name: 'Centro' }]);
  });

  it('keeps the newest operation when it arrives first', async () => {
    purchaseRows = [
      { cashier_id: 5, purchase_date: '2026-08-10T10:00:00Z' },
      { cashier_id: 5, purchase_date: '2026-08-01T10:00:00Z' },
    ];
    const payload = await getStaff('cashier');
    expect(payload.members[0].lastOperationAt).toBe('2026-08-10T10:00:00Z');
  });

  it('skips the purchase lookup for collaborators', async () => {
    const payload = await getStaff('collaborator');
    expect(payload.members[0].operationsThisMonth).toBe(0);
  });

  it('drops rows whose role join came back empty', async () => {
    userRows = [{ id: 5, role: null }];
    expect((await getStaff('cashier')).members).toHaveLength(0);
  });

  it('fills in defaults for a sparse row', async () => {
    userRows = [{ id: 5, role: { name: 'cashier' }, branch_id: null, branch: null }];
    const [only] = (await getStaff('cashier')).members;
    expect(only).toMatchObject({
      firstName: null,
      lastName: null,
      email: null,
      active: true,
      branchId: null,
      branchName: null,
      createdAt: null,
    });
  });

  it('returns nothing when there is no active organization', async () => {
    getActiveOrgIdFilter.mockResolvedValue(null);
    expect(await getStaff('cashier')).toEqual({ orgId: null, members: [], branches: [] });
  });

  it('survives null payloads', async () => {
    userRows = null;
    branchRows = null;
    purchaseRows = null;
    const payload = await getStaff('cashier');
    expect(payload.members).toEqual([]);
    expect(payload.branches).toEqual([]);
  });
});

describe('staffName', () => {
  it('joins the name and falls back to the email', () => {
    expect(staffName(member())).toBe('Ana Diaz');
    expect(staffName(member({ firstName: null, lastName: null }))).toBe('ana@test.com');
    expect(staffName(member({ firstName: null, lastName: null, email: null }))).toBe('');
  });
});

describe('staffInitials', () => {
  it('takes the first two initials', () => {
    expect(staffInitials('Ana Diaz')).toBe('AD');
    expect(staffInitials('')).toBe('?');
  });
});

describe('filterStaff', () => {
  const members = [
    member(),
    member({ id: '2', firstName: 'Luis', lastName: 'Perez', email: 'luis@test.com', active: false, branchId: null }),
  ];

  it('matches a member that only has an email', () => {
    const anonymous = member({ id: '3', firstName: null, lastName: null, email: 'x@test.com' });
    expect(filterStaff([anonymous], { q: 'x@test', status: '', branch: '' })).toHaveLength(1);
    expect(
      filterStaff([member({ email: null })], { q: 'ana', status: '', branch: '' }),
    ).toHaveLength(1);
  });

  it('matches the search against name and email', () => {
    expect(filterStaff(members, { q: 'luis', status: '', branch: '' })).toHaveLength(1);
    expect(filterStaff(members, { q: 'zzz', status: '', branch: '' })).toHaveLength(0);
  });

  it('filters by status', () => {
    expect(filterStaff(members, { q: '', status: 'active', branch: '' })).toHaveLength(1);
    expect(filterStaff(members, { q: '', status: 'inactive', branch: '' })).toHaveLength(1);
  });

  it('filters by branch, including those without one', () => {
    expect(filterStaff(members, { q: '', status: '', branch: '3' })).toHaveLength(1);
    expect(filterStaff(members, { q: '', status: '', branch: 'none' })).toHaveLength(1);
  });

  it('keeps everything with no filters', () => {
    expect(filterStaff(members, { q: '', status: '', branch: '' })).toHaveLength(2);
  });
});
