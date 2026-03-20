import CreateUserRolePage from '@/app/dashboard/user-role/create/page';

jest.mock('@/components/dashboard/user_role_crud/user-role-form', () => {
  return function MockUserRoleForm() { return <div data-testid="user-role-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateUserRolePage', () => {
  it('exports a default async function', () => {
    expect(typeof CreateUserRolePage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreateUserRolePage();
    expect(result).toBeTruthy();
  });
});
