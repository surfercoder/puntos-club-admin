import CreateProductPage from '@/app/dashboard/product/create/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('@/components/dashboard/plan/plan-limit-guard', () => ({
  PlanLimitGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/dashboard/product/product-form', () => {
  return function MockProductForm() { return <div data-testid="product-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateProductPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreateProductPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreateProductPage();
    expect(result).toBeTruthy();
  });
});
