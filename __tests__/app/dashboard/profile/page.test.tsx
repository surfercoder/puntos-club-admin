import { redirect } from 'next/navigation';
import ProfilePage from '@/app/dashboard/profile/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })) } })) }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', first_name: 'Test', last_name: 'User', email: 'test@test.com' })) }));
jest.mock('@/components/dashboard/profile/profile-form', () => ({ ProfileForm: () => <div data-testid="profile-form" /> }));

describe('ProfilePage', () => {
  it('exports a default async function', () => { expect(typeof ProfilePage).toBe('function'); });
  it('renders without crashing', async () => { const result = await ProfilePage(); expect(result).toBeTruthy(); });

  it('redirects to login when no auth user', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: null } })) },
    });
    await ProfilePage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to login when getCurrentUser returns null', async () => {
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    getCurrentUser.mockResolvedValueOnce(null);
    await ProfilePage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });
});
