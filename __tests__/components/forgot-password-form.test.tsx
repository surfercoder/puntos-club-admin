import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { createClient } from '@/lib/supabase/client';

describe('ForgotPasswordForm', () => {
  const mockResetPasswordForEmail = jest.fn();

  beforeEach(() => {
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });
  });

  it('renders email input and submit button', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'submitButton' })).toBeInTheDocument();
  });

  it('renders login link', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('link', { name: 'loginLink' })).toHaveAttribute('href', '/auth/login');
  });

  it('shows validation error on empty email submit', async () => {
    render(<ForgotPasswordForm />);
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'not-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('Dirección de correo inválida')).toBeInTheDocument();
    });
  });

  it('shows success card after successful reset', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('successTitle')).toBeInTheDocument();
      expect(screen.getByText('successDescription')).toBeInTheDocument();
      expect(screen.getByText('successMessage')).toBeInTheDocument();
    });
  });

  it('shows error message on reset failure', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: new Error('Rate limit exceeded'),
    });

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('shows generic error when resetPasswordForEmail throws unexpected error', async () => {
    mockResetPasswordForEmail.mockRejectedValue('unexpected');

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'submitButton' }));

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    let resolveReset: (value: unknown) => void;
    mockResetPasswordForEmail.mockImplementation(
      () => new Promise((resolve) => { resolveReset = resolve; })
    );

    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    resolveReset!({ error: null });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'submitButton' })).not.toBeInTheDocument();
    });
  });

  it('reducer default case returns state unchanged', () => {
    let capturedReducer: Function | null = null;
    const originalUseReducer = React.useReducer;
    const spy = jest.spyOn(React, 'useReducer').mockImplementation((reducer: any, initialState: any) => {
      capturedReducer = reducer;
      return originalUseReducer(reducer, initialState);
    });

    render(<ForgotPasswordForm />);
    spy.mockRestore();

    expect(capturedReducer).not.toBeNull();
    const state = { email: '', error: null, fieldErrors: {}, success: false, isLoading: false };
    const result = capturedReducer!(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });
});
