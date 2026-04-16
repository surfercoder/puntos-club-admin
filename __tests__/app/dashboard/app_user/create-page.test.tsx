import CreateAppUserPage from '@/app/dashboard/app_user/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/app_user/app_user-form', () => function Mock(props: Record<string, unknown>) { return <div data-role={props.currentUserRole} />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn() }));

const { getCurrentUser } = require('@/lib/auth/get-current-user');

describe('CreateAppUserPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof CreateAppUserPage).toBe('function'); });

  it('renders and passes currentUserRole when user has role object with name', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1', role: { name: 'collaborator' } });
    const result = await CreateAppUserPage();
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when user has no role', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1' });
    const result = await CreateAppUserPage();
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when user is null', async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    const result = await CreateAppUserPage();
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when role is a string (not an object)', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1', role: 'admin' });
    const result = await CreateAppUserPage();
    expect(result).toBeTruthy();
  });

  it('passes undefined currentUserRole when role object has no name key', async () => {
    getCurrentUser.mockResolvedValueOnce({ id: '1', role: { id: '5' } });
    const result = await CreateAppUserPage();
    expect(result).toBeTruthy();
  });
});
