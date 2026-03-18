import Page from '@/app/auth/error/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('Auth Error Page', () => {
  it('exports a default async function', () => { expect(typeof Page).toBe('function'); });
  it('renders with error param', async () => { const result = await Page({ searchParams: Promise.resolve({ error: 'test_error' }) }); expect(result).toBeTruthy(); });
  it('renders without error param (empty string)', async () => { const result = await Page({ searchParams: Promise.resolve({ error: '' }) }); expect(result).toBeTruthy(); });
  it('renders with null-ish searchParams', async () => {
    const result = await Page({ searchParams: Promise.resolve({ error: undefined as unknown as string }) });
    expect(result).toBeTruthy();
  });
});
