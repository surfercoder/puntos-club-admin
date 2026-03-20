import { render } from '@testing-library/react';
import { PublicHeader } from '@/components/public-header';

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

describe('PublicHeader', () => {
  it('exports a named async function', () => {
    expect(typeof PublicHeader).toBe('function');
  });

  it('renders without crashing', async () => {
    const jsx = await PublicHeader();
    const { container } = render(jsx);
    expect(container.querySelector('header')).toBeInTheDocument();
  });

  it('renders sign in link', async () => {
    const jsx = await PublicHeader();
    const { getByText } = render(jsx);
    expect(getByText('signIn')).toBeInTheDocument();
  });

  it('renders language switcher', async () => {
    const jsx = await PublicHeader();
    const { getByTestId } = render(jsx);
    expect(getByTestId('language-switcher')).toBeInTheDocument();
  });
});
