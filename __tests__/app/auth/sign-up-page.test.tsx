import { render } from '@testing-library/react';
import Page from '@/app/auth/sign-up/page';
jest.mock('@/components/sign-up-form', () => ({ SignUpForm: () => <div data-testid="sign-up-form" /> }));

describe('Sign Up Page', () => {
  it('exports a default function', () => { expect(typeof Page).toBe('function'); });

  it('renders the SignUpForm component', () => {
    const { getByTestId } = render(<Page />);
    expect(getByTestId('sign-up-form')).toBeInTheDocument();
  });
});
