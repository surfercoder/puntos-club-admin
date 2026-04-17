import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { UpdatePasswordForm } from '@/components/update-password-form';
import { createClient } from '@/lib/supabase/client';

let capturedReducer: ((state: Record<string, unknown>, action: Record<string, unknown>) => Record<string, unknown>) | null = null;

describe('UpdatePasswordForm', () => {
  const mockPush = jest.fn();
  const mockUpdateUser = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });

    (createClient as jest.Mock).mockReturnValue({
      auth: {
        updateUser: mockUpdateUser,
      },
    });
  });

  const strongPassword = 'Strong1!';

  it('renders password input and submit button', () => {
    render(<UpdatePasswordForm />);
    expect(screen.getByLabelText('newPassword')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submitButton' })).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(<UpdatePasswordForm />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('shows password strength checklist when typing', () => {
    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'a' } });
    // Should show 5 checklist items
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('shows validation error for weak password on submit', async () => {
    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('passwordWeak')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password on submit', async () => {
    render(<UpdatePasswordForm />);
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('passwordWeak')).toBeInTheDocument();
    });
  });

  it('does not call updateUser when password is weak', async () => {
    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('passwordWeak')).toBeInTheDocument();
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('redirects to dashboard on successful update', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: strongPassword });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on update failure', async () => {
    mockUpdateUser.mockResolvedValue({
      error: new Error('Password too weak'),
    });

    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
    });
  });

  it('shows generic error when updateUser throws unexpected error', async () => {
    mockUpdateUser.mockRejectedValue('unexpected');

    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<UpdatePasswordForm />);
    const passwordInput = screen.getByLabelText('newPassword');
    const toggleButton = screen.getByRole('button', { name: 'Show password' });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('disables submit button while loading', async () => {
    let resolveUpdate: (value: unknown) => void;
    mockUpdateUser.mockImplementation(
      () => new Promise((resolve) => { resolveUpdate = resolve; })
    );

    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
    });

    resolveUpdate!({ error: null });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'submitButton' })).not.toBeDisabled();
    });
  });

  it('returns unchanged state for unknown action type in reducer', () => {
    const originalUseReducer = React.useReducer.bind(React);
    jest.spyOn(React, 'useReducer').mockImplementation(
      (reducer: Parameters<typeof React.useReducer>[0], initialArg: Parameters<typeof React.useReducer>[1], init?: Parameters<typeof React.useReducer>[2]) => {
        capturedReducer = reducer;
        return originalUseReducer(reducer, initialArg, init);
      },
    );

    render(<UpdatePasswordForm />);
    jest.restoreAllMocks();

    expect(capturedReducer).not.toBeNull();
    const state = { password: '', showPassword: false, error: null, submitted: false, isLoading: false };
    const result = capturedReducer!(state, { type: 'UNKNOWN_ACTION' } as Record<string, unknown>);
    expect(result).toBe(state);
  });
});
