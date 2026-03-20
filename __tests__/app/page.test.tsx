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

jest.mock('@/components/landing/landing-app', () => ({
  LandingApp: () => <div data-testid="landing-app">LandingApp</div>,
}));


describe('Home page', () => {
  it('exports a default function', () => {
    expect(typeof Home).toBe('function');
  });

  it('renders PublicHeader and LandingApp', () => {
    render(<Home />);
    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('landing-app')).toBeInTheDocument();
  });
});
