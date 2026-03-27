import { render } from '@testing-library/react';
import Page, { generateMetadata } from '@/app/auth/login/page';
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/components/login-form', () => ({ LoginForm: () => <div data-testid="login-form" /> }));

describe('Login Page', () => {
  it('exports a default function', () => { expect(typeof Page).toBe('function'); });

  it('renders the LoginForm component', () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId('login-form')).toBeInTheDocument();
  });

  it('generateMetadata returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });
});
