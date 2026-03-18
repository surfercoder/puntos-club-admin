import NotFound from '@/app/not-found';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

describe('NotFound page', () => {
  it('exports a default async function', () => {
    expect(typeof NotFound).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await NotFound();
    expect(result).toBeTruthy();
  });
});
