import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { signInAdminPortal } from '@/actions/auth/actions';

jest.mock('@/actions/auth/actions', () => ({
  signInAdminPortal: jest.fn(),
}));

describe('LoginForm', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('renders email and password inputs', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: 'title' })).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: 'forgotPassword' })).toHaveAttribute('href', '/auth/forgot-password');
  });

  it('renders sign up link', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: 'signUpLink' })).toHaveAttribute('href', '/auth/sign-up');
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument();
    });
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'not-email' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('Dirección de correo inválida')).toBeInTheDocument();
    });
  });

  it('calls signInAdminPortal and redirects on success', async () => {
    (signInAdminPortal as jest.Mock).mockResolvedValue({ success: true });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(signInAdminPortal).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error message on failed login', async () => {
    (signInAdminPortal as jest.Mock).mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows noPermission error when login fails with no error message', async () => {
    (signInAdminPortal as jest.Mock).mockResolvedValue({ success: false, error: null });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('noPermission')).toBeInTheDocument();
    });
  });

  it('shows generic error when signInAdminPortal throws non-Error', async () => {
    (signInAdminPortal as jest.Mock).mockRejectedValue('string error');

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('shows generic error when signInAdminPortal throws', async () => {
    (signInAdminPortal as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    let resolveLogin: (value: unknown) => void;
    (signInAdminPortal as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    resolveLogin!({ success: true });

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it('reducer default case returns state unchanged', () => {
    // Capture the reducer by spying on useReducer
    let capturedReducer: Function | null = null;
    const originalUseReducer = React.useReducer;
    const spy = jest.spyOn(React, 'useReducer').mockImplementation((reducer: any, initialState: any) => {
      capturedReducer = reducer;
      return originalUseReducer(reducer, initialState);
    });

    render(<LoginForm />);
    spy.mockRestore();

    expect(capturedReducer).not.toBeNull();
    const state = { email: '', password: '', error: null, fieldErrors: {}, isLoading: false };
    const result = capturedReducer!(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });
});
