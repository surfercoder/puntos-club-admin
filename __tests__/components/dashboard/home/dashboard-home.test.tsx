import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { Clubi } from '@/components/dashboard/home/clubi';
import { GiftIllustration } from '@/components/dashboard/home/gift-illustration';
import { HelpCard } from '@/components/dashboard/home/help-card';
import { QuickActions } from '@/components/dashboard/home/quick-actions';
import { QuickSummary } from '@/components/dashboard/home/quick-summary';
import { DashboardHero } from '@/components/dashboard/home/dashboard-hero';
import { START_TOUR_EVENT } from '@/components/dashboard/tour/dashboard-tour';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('@/components/dashboard/tour/dashboard-tour', () => ({
  START_TOUR_EVENT: 'puntosclub:start-tour',
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div>
      <button data-testid="range-change" onClick={() => onValueChange('12')} />
      <span data-testid="range-value">{value}</span>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

describe('GiftIllustration', () => {
  it('renders an inline svg', () => {
    const { container } = render(<GiftIllustration className="h-10" />);
    expect(container.querySelector('svg')).toHaveClass('h-10');
  });
});

describe('Clubi', () => {
  it('renders with the default accent', () => {
    const { container } = render(<Clubi />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('accepts a custom accent and class', () => {
    const { container } = render(<Clubi accent="#000000" className="w-8" />);
    expect(container.querySelector('svg')).toHaveClass('w-8');
    expect(container.querySelector('[fill="#000000"]')).not.toBeNull();
  });
});

describe('DashboardHero', () => {
  it('greets the user and pushes the chosen range into the query string', () => {
    // El handler lee la URL de window.location, no de useSearchParams.
    window.history.replaceState({}, '', '/dashboard?foo=bar');
    render(
      <DashboardHero firstName="Carlos" organizationName="One Store" range={6} />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('range-value')).toHaveTextContent('6');

    fireEvent.click(screen.getByTestId('range-change'));
    expect(replace).toHaveBeenCalledWith('/dashboard?foo=bar&range=12');
  });
});

describe('QuickActions', () => {
  it('links to the four shortcuts from the design', async () => {
    render(await QuickActions());
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/dashboard/purchase/create',
      '/dashboard/product/create',
      '/dashboard/qr',
      '/dashboard/redemption',
    ]);
  });
});

describe('QuickSummary', () => {
  it('formats point rows with a pts suffix and plain counts without it', async () => {
    render(
      await QuickSummary({
        months: 6,
        data: {
          availablePoints: 14500,
          pointsGranted: 23500,
          pointsRedeemed: 9000,
          totalBeneficiaries: 4,
          activeBeneficiaries: 3,
        },
      }),
    );
    expect(screen.getByText('14.500 pts')).toBeInTheDocument();
    expect(screen.getByText('23.500 pts')).toBeInTheDocument();
    expect(screen.getByText('9.000 pts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('HelpCard', () => {
  it('dispatches the start-tour event when the CTA is pressed', () => {
    const listener = jest.fn();
    window.addEventListener(START_TOUR_EVENT, listener);
    render(<HelpCard />);
    fireEvent.click(screen.getByRole('button'));
    expect(listener).toHaveBeenCalled();
    window.removeEventListener(START_TOUR_EVENT, listener);
  });
});
