import CreateOrganizationPage from '@/app/dashboard/organization/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/organization/organization-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('CreateOrganizationPage', () => {
  it('exports a default async function', () => { expect(typeof CreateOrganizationPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateOrganizationPage(); expect(result).toBeTruthy(); });
});
