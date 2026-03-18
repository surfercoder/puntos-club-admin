import CreateBeneficiaryOrganizationPage from '@/app/dashboard/beneficiary_organization/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/beneficiary_organization/beneficiary_organization-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateBeneficiaryOrganizationPage', () => {
  it('exports a default async function', () => { expect(typeof CreateBeneficiaryOrganizationPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateBeneficiaryOrganizationPage(); expect(result).toBeTruthy(); });
});
