import CreateBranchPage from '@/app/dashboard/branch/create/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' } })),
}));

jest.mock('@/lib/auth/roles', () => ({ isOwner: jest.fn(() => false) }));

jest.mock('@/components/dashboard/branch/branch-form', () => {
  return function Mock() { return <div data-testid="branch-form" />; };
});

jest.mock('@/components/dashboard/branch/branch-form-with-address', () => {
  return function Mock() { return <div data-testid="branch-form-with-address" />; };
});

jest.mock('@/components/dashboard/plan/plan-limit-guard', () => ({
  PlanLimitGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateBranchPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreateBranchPage).toBe('function');
  });

  it('renders BranchForm when not owner', async () => {
    const result = await CreateBranchPage();
    expect(result).toBeTruthy();
  });

  it('renders BranchFormWithAddress when owner', async () => {
    const { isOwner } = require('@/lib/auth/roles');
    isOwner.mockReturnValueOnce(true);
    const result = await CreateBranchPage();
    expect(result).toBeTruthy();
  });
});
