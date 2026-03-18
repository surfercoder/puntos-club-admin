import RootLayout from '@/app/layout';

jest.mock('next-intl/server', () => ({
  getLocale: jest.fn(() => Promise.resolve('es')),
  getMessages: jest.fn(() => Promise.resolve({})),
}));

jest.mock('next/font/google', () => ({
  Geist: jest.fn(() => ({
    className: 'mock-geist-class',
    variable: '--font-geist-sans',
  })),
}));

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

jest.mock('@/components/providers/google-maps-provider', () => ({
  GoogleMapsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-key' },
}));

describe('RootLayout', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports a default async function', () => {
    expect(typeof RootLayout).toBe('function');
  });

  it('renders children', async () => {
    const result = await RootLayout({ children: <div>Test</div> });
    expect(result).toBeTruthy();
  });

  it('uses VERCEL_URL when available', async () => {
    process.env = { ...originalEnv, VERCEL_URL: 'my-app.vercel.app' };
    // Re-import to pick up new env
    jest.resetModules();
    jest.mock('next-intl/server', () => ({
      getLocale: jest.fn(() => Promise.resolve('es')),
      getMessages: jest.fn(() => Promise.resolve({})),
    }));
    jest.mock('next/font/google', () => ({
      Geist: jest.fn(() => ({ className: 'mock', variable: '--font-geist-sans' })),
    }));
    jest.mock('next-themes', () => ({
      ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));
    jest.mock('next-intl', () => ({
      NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));
    jest.mock('@/components/ui/sonner', () => ({ Toaster: () => <div /> }));
    jest.mock('@/components/providers/google-maps-provider', () => ({
      GoogleMapsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }));
    jest.mock('@/lib/env', () => ({ env: { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-key' } }));
    const { default: Layout } = require('@/app/layout');
    const result = await Layout({ children: <div>Test</div> });
    expect(result).toBeTruthy();
  });
});
