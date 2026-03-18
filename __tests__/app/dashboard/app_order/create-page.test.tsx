import CreateAppOrderPage from '@/app/dashboard/app_order/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/app_order/app_order-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('CreateAppOrderPage', () => {
  it('exports a default async function', () => { expect(typeof CreateAppOrderPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateAppOrderPage(); expect(result).toBeTruthy(); });
});
