jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from '@/lib/auth/get-current-user';

// Load the real guard even though jest.setup.js globally mocks it for other suites.
const { requireUser, requirePlatformAdmin } = jest.requireActual('@/lib/auth/require-user') as {
  requireUser: () => Promise<unknown>;
  requirePlatformAdmin: () => Promise<unknown>;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireUser', () => {
  it('returns the current user when authenticated', async () => {
    const user = { id: 1, role: { name: 'owner' } };
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    await expect(requireUser()).resolves.toBe(user);
  });

  it('throws when there is no authenticated user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow('auth.sessionExpired');
  });
});

describe('requirePlatformAdmin', () => {
  it('deja pasar al superadmin', async () => {
    const user = { id: 1, role: { name: 'admin' } };
    (getCurrentUser as jest.Mock).mockResolvedValue(user);

    await expect(requirePlatformAdmin()).resolves.toBe(user);
  });

  it.each(['owner', 'collaborator', 'cashier'])('rechaza a un %s', async (role) => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, role: { name: role } });

    await expect(requirePlatformAdmin()).rejects.toThrow('db.forbidden');
  });

  it('sin sesion falla como requireUser', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    await expect(requirePlatformAdmin()).rejects.toThrow('auth.sessionExpired');
  });
});
