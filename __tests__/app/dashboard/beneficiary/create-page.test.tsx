import CreateBeneficiaryPage from '@/app/dashboard/beneficiary/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/beneficiary/beneficiary-form', () => function Mock() { return <div data-testid="beneficiary-form" />; });
jest.mock('@/components/dashboard/plan/plan-limit-guard', () => ({ PlanLimitGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateBeneficiaryPage', () => {
  it('exports a default async function', () => { expect(typeof CreateBeneficiaryPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateBeneficiaryPage(); expect(result).toBeTruthy(); });
});
