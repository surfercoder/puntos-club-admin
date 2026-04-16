import { render, screen } from '@testing-library/react';
import MobileAppsLayout from '@/app/mobile-apps/layout';

jest.mock('@/components/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Header</div>,
}));

describe('MobileAppsLayout', () => {
  it('exports a default function', () => {
    expect(typeof MobileAppsLayout).toBe('function');
  });

  it('renders children with header', () => {
    render(
      <MobileAppsLayout>
        <div data-testid="child">Child Content</div>
      </MobileAppsLayout>
    );

    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
