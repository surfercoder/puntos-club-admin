import { render } from '@testing-library/react';
import Page from '@/app/auth/login/page';
jest.mock('@/components/login-form', () => ({ LoginForm: () => <div data-testid="login-form" /> }));

describe('Login Page', () => {
  it('exports a default function', () => { expect(typeof Page).toBe('function'); });

  it('renders the LoginForm component', () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId('login-form')).toBeInTheDocument();
  });
});
