import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';

const cookieGet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: cookieGet })),
}));

// belongsToOrg query: maybeSingle resolves to a row when the user is a member.
const maybeSingle = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
        }),
      }),
    })
  ),
}));

const makeUser = (role: string | null, organization_id: string | null) =>
  ({
    id: 'u1',
    organization_id: organization_id as string,
    tour_completed: false,
    created_at: '',
    updated_at: '',
    role: role ? { name: role } : undefined,
  }) as Parameters<typeof getActiveOrgIdFilter>[0];

describe('getActiveOrgIdFilter', () => {
  beforeEach(() => {
    cookieGet.mockReset();
    maybeSingle.mockReset();
    maybeSingle.mockResolvedValue({ data: null }); // not a member by default
  });

  it('returns null for admin regardless of cookie', async () => {
    cookieGet.mockReturnValue({ value: '5' });
    const result = await getActiveOrgIdFilter(makeUser('admin', '1'));
    expect(result).toBeNull();
  });

  it('returns cookie value for non-admin when it matches their primary org (no membership query)', async () => {
    cookieGet.mockReturnValue({ value: '1' });
    const result = await getActiveOrgIdFilter(makeUser('owner', '1'));
    expect(result).toBe(1);
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it('honors a cookie for a different org when the user is an active member', async () => {
    maybeSingle.mockResolvedValue({ data: { organization_id: 7 } });
    cookieGet.mockReturnValue({ value: '7' });
    const result = await getActiveOrgIdFilter(makeUser('owner', '1'));
    expect(result).toBe(7);
  });

  it('ignores a cookie for an org the user does not belong to and falls back (the phantom-org bug)', async () => {
    maybeSingle.mockResolvedValue({ data: null });
    cookieGet.mockReturnValue({ value: '3' }); // org 3 doesn't exist / not a member
    const result = await getActiveOrgIdFilter(makeUser('owner', '1'));
    expect(result).toBe(1);
  });

  it('falls back to currentUser.organization_id when cookie missing (the bug fix)', async () => {
    cookieGet.mockReturnValue(undefined);
    const result = await getActiveOrgIdFilter(makeUser('owner', '3'));
    expect(result).toBe(3);
  });

  it('falls back to currentUser.organization_id when cookie value is non-numeric', async () => {
    cookieGet.mockReturnValue({ value: 'not-a-number' });
    const result = await getActiveOrgIdFilter(makeUser('cashier', '4'));
    expect(result).toBe(4);
  });

  it('returns null when non-admin has no cookie and no organization_id', async () => {
    cookieGet.mockReturnValue(undefined);
    const result = await getActiveOrgIdFilter(makeUser('owner', null));
    expect(result).toBeNull();
  });

  it('returns null for null currentUser', async () => {
    cookieGet.mockReturnValue(undefined);
    const result = await getActiveOrgIdFilter(null);
    expect(result).toBeNull();
  });

  it('rejects zero/negative cookie values and falls back', async () => {
    cookieGet.mockReturnValue({ value: '0' });
    const result = await getActiveOrgIdFilter(makeUser('collaborator', '9'));
    expect(result).toBe(9);
  });
});
