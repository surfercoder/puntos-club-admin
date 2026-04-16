import { render, screen } from '@testing-library/react';
import { NewUserButton } from '@/components/dashboard/app_user/new-user-button';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

describe('NewUserButton', () => {
  it('renders a link to create page when not at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      isLoading: false,
      isAtLimit: jest.fn(() => false),
    });
    render(<NewUserButton />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard/app_user/create');
  });

  it('renders as enabled link while loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      isLoading: true,
      isAtLimit: jest.fn(() => true),
    });
    render(<NewUserButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('renders as disabled button when both cashiers and collaborators are at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });
    render(<NewUserButton />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders as link when only cashiers is at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      isLoading: false,
      isAtLimit: jest.fn((feature: string) => feature === 'cashiers'),
    });
    render(<NewUserButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('renders as link when only collaborators is at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      isLoading: false,
      isAtLimit: jest.fn((feature: string) => feature === 'collaborators'),
    });
    render(<NewUserButton />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
