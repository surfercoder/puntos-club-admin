import CreatePlanLimitPage from '@/app/dashboard/plan_limits/create/page';

jest.mock('@/components/dashboard/plan_limits/plan-limit-form', () => {
  return function MockPlanLimitForm() { return <div data-testid="plan-limit-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreatePlanLimitPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreatePlanLimitPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreatePlanLimitPage();
    expect(result).toBeTruthy();
  });
});
