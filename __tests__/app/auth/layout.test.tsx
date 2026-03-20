import { render, screen } from '@testing-library/react';
import AuthLayout from '@/app/auth/layout';

jest.mock('@/components/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Header</div>,
}));

describe('AuthLayout', () => {
  it('exports a default function', () => {
    expect(typeof AuthLayout).toBe('function');
  });

  it('renders children with header', () => {
    render(
      <AuthLayout>
        <div data-testid="child">Child Content</div>
      </AuthLayout>
    );

    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
