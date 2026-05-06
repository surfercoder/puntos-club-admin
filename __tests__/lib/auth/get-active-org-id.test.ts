import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';

const cookieGet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: cookieGet })),
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
  });

  it('returns null for admin regardless of cookie', async () => {
    cookieGet.mockReturnValue({ value: '5' });
    const result = await getActiveOrgIdFilter(makeUser('admin', '1'));
    expect(result).toBeNull();
  });

  it('returns cookie value for non-admin when valid', async () => {
    cookieGet.mockReturnValue({ value: '7' });
    const result = await getActiveOrgIdFilter(makeUser('owner', '1'));
    expect(result).toBe(7);
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
