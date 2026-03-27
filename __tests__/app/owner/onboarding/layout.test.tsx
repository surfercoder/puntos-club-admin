import { render, screen } from '@testing-library/react';
import OnboardingLayout, { generateMetadata } from '@/app/owner/onboarding/layout';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
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

  it('generateMetadata returns correct metadata', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeDefined();
  });
});
