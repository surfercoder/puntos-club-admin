import CreatePurchasePage from '@/app/dashboard/purchase/create/page';

jest.mock('@/components/dashboard/purchase/purchase-form', () => {
  return function MockPurchaseForm() { return <div data-testid="purchase-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreatePurchasePage', () => {
  it('exports a default async function', () => {
    expect(typeof CreatePurchasePage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreatePurchasePage();
    expect(result).toBeTruthy();
  });
});
