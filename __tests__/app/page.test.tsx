import { render, screen } from '@testing-library/react';
import Home, { generateMetadata } from '@/app/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    };
    return Promise.resolve(t);
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

jest.mock('@/components/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Header</div>,
}));

jest.mock('@/components/landing/landing-app', () => ({
  LandingApp: ({ planLimits }: { planLimits: unknown }) => (
    <div data-testid="landing-app">{JSON.stringify(planLimits)}</div>
  ),
}));

jest.mock('@/lib/plans/public-limits', () => ({
  getPublicPlanLimits: jest.fn(() => Promise.resolve({ trial: { branches: 1 } })),
}));


describe('Home page', () => {
  it('exports a default function', () => {
    expect(typeof Home).toBe('function');
  });

  it('renders PublicHeader and LandingApp with the public plan limits', async () => {
    render(await Home());
    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('landing-app')).toHaveTextContent('{"trial":{"branches":1}}');
  });

  it('generateMetadata returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });
});
