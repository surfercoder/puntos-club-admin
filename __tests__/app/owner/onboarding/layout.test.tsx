import { render, screen } from '@testing-library/react';
import OnboardingLayout from '@/app/owner/onboarding/layout';

jest.mock('@/components/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Puntos Club</div>,
}));
jest.mock('@/components/public-footer', () => ({
  PublicFooter: () => <div data-testid="public-footer">Footer</div>,
}));

describe('OnboardingLayout', () => {
  it('exports a default function', () => { expect(typeof OnboardingLayout).toBe('function'); });

  it('renders children and header', () => {
    render(<OnboardingLayout><div data-testid="child">content</div></OnboardingLayout>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Puntos Club')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<OnboardingLayout><div>test</div></OnboardingLayout>);
    expect(screen.getByTestId('public-footer')).toBeInTheDocument();
  });
});
