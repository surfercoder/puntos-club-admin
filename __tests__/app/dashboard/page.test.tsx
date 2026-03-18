import { redirect } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
        error: null,
      })),
    },
  })),
}));

describe('DashboardPage', () => {
  it('exports a default async function', () => {
    expect(typeof DashboardPage).toBe('function');
  });

  it('renders dashboard content when authenticated', async () => {
    const result = await DashboardPage();
    expect(result).toBeTruthy();
  });

  it('redirects to login when not authenticated', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: jest.fn(() => Promise.resolve({
          data: { user: null },
          error: { message: 'Not authenticated' },
        })),
      },
    });

    await DashboardPage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });
});
