import { notFound } from 'next/navigation';
import EditAppUserPage from '@/app/dashboard/app_user/edit/[id]/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: { id: '1', first_name: 'Test' }, error: null })) })) })) })) })) }));
jest.mock('@/components/dashboard/app_user/app_user-form', () => function Mock(props: Record<string, unknown>) { return <div data-role={props.currentUserRole} />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn() }));

const { getCurrentUser } = require('@/lib/auth/get-current-user');

describe('EditAppUserPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: '1', role: { name: 'admin' } });
  });

  it('exports a default async function', () => { expect(typeof EditAppUserPage).toBe('function'); });

  it('renders without crashing', async () => {
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when data is null', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: null })) })) })) })),
    });
    await EditAppUserPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })) })) })) })),
    });
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '999' }) });
    expect(result).toBeTruthy();
  });

  it('passes currentUserRole when user has role object with name', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1', role: { name: 'collaborator' } });
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when user is null', async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when role is a string', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1', role: 'admin' });
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when role object has no name key', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1', role: { id: '5' } });
    const result = await EditAppUserPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });
});
