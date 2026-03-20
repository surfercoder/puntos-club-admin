import CreateOrganizationPlanLimitPage from '@/app/dashboard/organization_plan_limits/create/page';

jest.mock('@/components/dashboard/organization_plan_limits/organization-plan-limit-form', () => {
  return function MockOrganizationPlanLimitForm() { return <div data-testid="organization-plan-limit-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateOrganizationPlanLimitPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreateOrganizationPlanLimitPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreateOrganizationPlanLimitPage();
    expect(result).toBeTruthy();
  });
});
