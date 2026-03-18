import { render } from '@testing-library/react';
import Page from '@/app/auth/forgot-password/page';
jest.mock('@/components/forgot-password-form', () => ({ ForgotPasswordForm: () => <div data-testid="forgot-password-form" /> }));

describe('Forgot Password Page', () => {
  it('exports a default function', () => { expect(typeof Page).toBe('function'); });

  it('renders the ForgotPasswordForm component', () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId('forgot-password-form')).toBeInTheDocument();
  });
});
