import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlanBadge } from '@/components/plan-badge';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { useSidebar } from '@/components/ui/sidebar';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));
jest.mock('@/components/providers/plan-usage-provider', () => ({
  usePlanUsage: jest.fn(() => ({ plan: 'trial', isLoading: false })),
}));
jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: jest.fn(() => ({ state: 'expanded' })),
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));
jest.mock('lucide-react', () => ({
  Star: (props: any) => <svg data-testid="star-icon" {...props} />,
  Zap: (props: any) => <svg data-testid="zap-icon" {...props} />,
  Rocket: (props: any) => <svg data-testid="rocket-icon" {...props} />,
}));

describe('PlanBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePlanUsage as jest.Mock).mockReturnValue({ plan: 'trial', isLoading: false });
    (useSidebar as jest.Mock).mockReturnValue({ state: 'expanded' });
  });

  it('returns null when loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({ plan: 'trial', isLoading: true });
    const { container } = render(<PlanBadge />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no plan', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({ plan: null, isLoading: false });
    const { container } = render(<PlanBadge />);
    expect(container.innerHTML).toBe('');
  });

  it('renders expanded badge for trial plan', () => {
    const { container } = render(<PlanBadge />);
    expect(container.innerHTML).toBeTruthy();
    expect(screen.getByTestId('star-icon')).toBeTruthy();
  });

  it('renders collapsed tooltip view', () => {
    (useSidebar as jest.Mock).mockReturnValue({ state: 'collapsed' });
    const { container } = render(<PlanBadge />);
    expect(container.innerHTML).toBeTruthy();
    expect(screen.getByTestId('star-icon')).toBeTruthy();
  });

  it('renders for advance plan', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({ plan: 'advance', isLoading: false });
    const { container } = render(<PlanBadge />);
    expect(container.innerHTML).toBeTruthy();
    expect(screen.getByTestId('zap-icon')).toBeTruthy();
  });

  it('renders for pro plan', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({ plan: 'pro', isLoading: false });
    const { container } = render(<PlanBadge />);
    expect(container.innerHTML).toBeTruthy();
    expect(screen.getByTestId('rocket-icon')).toBeTruthy();
  });
});
