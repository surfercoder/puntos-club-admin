import CreateAppUserOrganizationPage from '@/app/dashboard/app_user_organization/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/app_user_organization/app_user_organization-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('CreateAppUserOrganizationPage', () => {
  it('exports a default async function', () => { expect(typeof CreateAppUserOrganizationPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateAppUserOrganizationPage(); expect(result).toBeTruthy(); });
});
