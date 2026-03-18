import Page, { generateMetadata } from '@/app/auth/sign-up-success/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Sign Up Success Page', () => {
  it('exports a default async function', () => {
    expect(typeof Page).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await Page();
    expect(result).toBeTruthy();
  });

  it('generates metadata with title', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toEqual({ title: 'pageTitle' });
  });
});
