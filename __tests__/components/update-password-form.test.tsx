import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { UpdatePasswordForm } from '@/components/update-password-form';
import { createClient } from '@/lib/supabase/client';

let capturedReducer: ((state: Record<string, unknown>, action: Record<string, unknown>) => Record<string, unknown>) | null = null;

describe('UpdatePasswordForm', () => {
  const mockPush = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockSetSession = jest.fn().mockResolvedValue({ error: null });
  const mockSignOut = jest.fn().mockResolvedValue({ error: null });

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
        setSession: mockSetSession,
        signOut: mockSignOut,
      },
    });
    window.location.hash = '';
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

  // GoTrue responde en ingles; se mapea por `code` como el resto de la app.
  it('traduce el error de GoTrue en vez de mostrar su texto', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'New password should be different from the old password', code: 'same_password' },
    });

    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('auth.samePassword')).toBeInTheDocument();
    });
  });

  it('shows generic error when updateUser throws unexpected error', async () => {
    mockUpdateUser.mockRejectedValue('unexpected');

    render(<UpdatePasswordForm />);
    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('unexpected')).toBeInTheDocument();
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

  // Link de recuperacion abierto desde las apps moviles: flujo implicit, los
  // tokens llegan en el hash y al terminar no hay dashboard al que mandarlo.
  it('takes the session from the url hash and signs out after updating', async () => {
    window.location.hash = '#access_token=at&refresh_token=rt&type=recovery';
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<UpdatePasswordForm />);
    await waitFor(() =>
      expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'at', refresh_token: 'rt' }),
    );

    fireEvent.change(screen.getByLabelText('newPassword'), { target: { value: strongPassword } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => expect(screen.getByText('backToApp')).toBeInTheDocument());
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows the expired message when the link comes back with an error instead of tokens', async () => {
    window.location.hash = '#error_description=Email+link+is+invalid+or+has+expired';

    render(<UpdatePasswordForm />);

    await waitFor(() => expect(screen.getByText('linkExpired')).toBeInTheDocument());
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  // Un link recortado o mal reenviado llega sin access_token: sin sesion de
  // recuperacion el form no puede quedar enviable contra la sesion del browser.
  it('blocks the form when the recovery hash comes without an access token', async () => {
    window.location.hash = '#refresh_token=rt&type=recovery';

    render(<UpdatePasswordForm />);

    await waitFor(() => expect(screen.getByText('linkExpired')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'submitButton' })).not.toBeInTheDocument();
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  it('blocks the form when the recovery hash carries no tokens at all', async () => {
    window.location.hash = '#type=recovery';

    render(<UpdatePasswordForm />);

    await waitFor(() => expect(screen.getByText('linkExpired')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'submitButton' })).not.toBeInTheDocument();
  });

  it('shows the expired message when setSession rejects the tokens', async () => {
    window.location.hash = '#access_token=at&refresh_token=rt&type=recovery';
    mockSetSession.mockResolvedValueOnce({ error: { message: 'invalid' } });

    render(<UpdatePasswordForm />);

    await waitFor(() => expect(screen.getByText('linkExpired')).toBeInTheDocument());
  });
});
