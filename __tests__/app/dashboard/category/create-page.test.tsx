import CreateCategoryPage from '@/app/dashboard/category/create/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('@/components/dashboard/category/category-form', () => {
  return function MockCategoryForm() { return <div data-testid="category-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CreateCategoryPage', () => {
  it('exports a default async function', () => {
    expect(typeof CreateCategoryPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await CreateCategoryPage();
    expect(result).toBeTruthy();
  });
});
