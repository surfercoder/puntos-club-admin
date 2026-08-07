const mockCookieStore = { get: jest.fn(), set: jest.fn() };
jest.mock('next/headers', () => ({ cookies: jest.fn(() => mockCookieStore) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn() }));
jest.mock('@/lib/auth/get-active-org-id', () => ({ belongsToOrg: jest.fn() }));

import { getMutationOrgId } from '@/lib/auth/get-mutation-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { belongsToOrg } from '@/lib/auth/get-active-org-id';

const setUser = (organization_id: unknown) =>
  (getCurrentUser as jest.Mock).mockResolvedValue(organization_id === undefined ? null : { id: 1, organization_id });

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockReturnValue(undefined);
  (belongsToOrg as jest.Mock).mockResolvedValue(true);
  setUser(7);
});

it('prefers the active_org_id cookie for an org the user belongs to', async () => {
  mockCookieStore.get.mockReturnValue({ value: '42' });
  expect(await getMutationOrgId()).toBe(42);
  expect(belongsToOrg).toHaveBeenCalledWith(1, 42);
});

it('ignores a cookie pointing at an org the user does not belong to', async () => {
  mockCookieStore.get.mockReturnValue({ value: '42' });
  (belongsToOrg as jest.Mock).mockResolvedValue(false);
  expect(await getMutationOrgId()).toBe(7);
});

it('honors the users own org without a membership lookup', async () => {
  mockCookieStore.get.mockReturnValue({ value: '7' });
  expect(await getMutationOrgId()).toBe(7);
  expect(belongsToOrg).not.toHaveBeenCalled();
});

it('returns null for a valid cookie when there is no current user', async () => {
  setUser(undefined);
  mockCookieStore.get.mockReturnValue({ value: '42' });
  expect(await getMutationOrgId()).toBeNull();
  expect(belongsToOrg).not.toHaveBeenCalled();
});

it('ignores a foreign cookie when the user has no org of their own', async () => {
  setUser(null);
  mockCookieStore.get.mockReturnValue({ value: '42' });
  (belongsToOrg as jest.Mock).mockResolvedValue(false);
  expect(await getMutationOrgId()).toBeNull();
});

it('falls back to the users own org when the cookie is missing', async () => {
  expect(await getMutationOrgId()).toBe(7);
});

it.each([['abc'], [''], ['0'], ['-3']])(
  'falls back when the cookie value is unusable (%p)',
  async (value) => {
    mockCookieStore.get.mockReturnValue({ value });
    expect(await getMutationOrgId()).toBe(7);
  },
);

it('returns null when neither the cookie nor the user has an org', async () => {
  setUser(null);
  expect(await getMutationOrgId()).toBeNull();
});

it('returns null when there is no current user', async () => {
  setUser(undefined);
  expect(await getMutationOrgId()).toBeNull();
});

it('accepts a string organization_id on the user', async () => {
  setUser('9');
  expect(await getMutationOrgId()).toBe(9);
});
