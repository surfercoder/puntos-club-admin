import CreateStockPage from '@/app/dashboard/stock/create/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/dashboard/stock/stock-form', () => function Mock() { return <div data-testid="stock-form" />; });
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateStockPage', () => {
  it('exports a default async function', () => { expect(typeof CreateStockPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await CreateStockPage(); expect(result).toBeTruthy(); });
});
