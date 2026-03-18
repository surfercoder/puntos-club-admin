import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

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

jest.mock('@/components/public-footer', () => ({
  PublicFooter: () => <div data-testid="public-footer">Footer</div>,
}));

describe('Home page', () => {
  it('exports a default async function', () => {
    expect(typeof Home).toBe('function');
  });

  it('renders without crashing and includes feature cards', async () => {
    const jsx = await Home();
    render(jsx);
    // Verify the page renders with feature cards (covers FeatureCard function)
    expect(screen.getByText('featureQrTitle')).toBeInTheDocument();
    expect(screen.getByText('featureRewardsTitle')).toBeInTheDocument();
    expect(screen.getByText('featureNotificationsTitle')).toBeInTheDocument();
    expect(screen.getByText('featureDashboardTitle')).toBeInTheDocument();
    expect(screen.getByText('featureBranchesTitle')).toBeInTheDocument();
    expect(screen.getByText('featureClientsTitle')).toBeInTheDocument();
  });
});
