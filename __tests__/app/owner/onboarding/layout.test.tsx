import { render, screen } from '@testing-library/react';
import OnboardingLayout from '@/app/owner/onboarding/layout';

jest.mock('@/components/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Puntos Club</div>,
}));
describe('OnboardingLayout', () => {
  it('exports a default function', () => { expect(typeof OnboardingLayout).toBe('function'); });

  it('renders children and header', () => {
    render(<OnboardingLayout><div data-testid="child">content</div></OnboardingLayout>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Puntos Club')).toBeInTheDocument();
  });
});
