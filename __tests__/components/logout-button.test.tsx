import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogoutButton } from '@/components/logout-button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

describe('LogoutButton', () => {
  const mockPush = jest.fn();
  const mockSignOut = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: mockSignOut,
      },
    });
  });

  it('renders the logout button with translated text', () => {
    render(<LogoutButton />);
    const button = screen.getByRole('button', { name: 'logout' });
    expect(button).toBeInTheDocument();
  });

  it('calls signOut and redirects to /auth/login on click', async () => {
    render(<LogoutButton />);
    const button = screen.getByRole('button', { name: 'logout' });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('calls signOut before pushing route', async () => {
    const callOrder: string[] = [];
    mockSignOut.mockImplementation(async () => {
      callOrder.push('signOut');
    });
    mockPush.mockImplementation(() => {
      callOrder.push('push');
    });

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(callOrder).toEqual(['signOut', 'push']);
    });
  });
});
