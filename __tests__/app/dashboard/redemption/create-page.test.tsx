import CreateRedemptionPage from '@/app/dashboard/redemption/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/redemption/redemption-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('CreateRedemptionPage', () => {
  it('exports a default async function', () => { expect(typeof CreateRedemptionPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateRedemptionPage(); expect(result).toBeTruthy(); });
});
