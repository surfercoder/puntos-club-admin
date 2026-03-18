import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { SignUpForm } from '@/components/sign-up-form';
import { signUpAdmin } from '@/actions/auth/actions';

jest.mock('@/actions/auth/actions', () => ({
  signUpAdmin: jest.fn(),
}));

describe('SignUpForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('renders all form fields', () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText('name')).toBeInTheDocument();
    expect(screen.getByLabelText('lastName')).toBeInTheDocument();
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByLabelText('repeatPassword')).toBeInTheDocument();
  });

  it('renders submit button and login link', () => {
    render(<SignUpForm />);
    expect(screen.getByRole('button', { name: 'title' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'loginLink' })).toHaveAttribute('href', '/auth/login');
  });

  it('shows validation error for empty email', async () => {
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    });
  });

  it('shows password mismatch error', async () => {
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });

  it('calls signUpAdmin and redirects on success', async () => {
    (signUpAdmin as jest.Mock).mockResolvedValue({ success: true });

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('lastName'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(signUpAdmin).toHaveBeenCalledWith({
        email: 'john@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/sign-up-success');
    });
  });

  it('shows error message on failed sign up', async () => {
    (signUpAdmin as jest.Mock).mockResolvedValue({ success: false, error: 'Email already exists' });

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('shows generic error when signUp fails with no error message', async () => {
    (signUpAdmin as jest.Mock).mockResolvedValue({ success: false, error: null });

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('shows error message for non-Error thrown exceptions', async () => {
    (signUpAdmin as jest.Mock).mockRejectedValue('string error');

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  it('submits without firstName and lastName', async () => {
    (signUpAdmin as jest.Mock).mockResolvedValue({ success: true });

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(signUpAdmin).toHaveBeenCalledWith({
        email: 'john@test.com',
        password: 'password123',
        firstName: undefined,
        lastName: undefined,
      });
    });
  });

  it('shows generic error when signUpAdmin throws', async () => {
    (signUpAdmin as jest.Mock).mockRejectedValue(new Error('Server error'));

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'title' }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    let resolveSignUp: (value: unknown) => void;
    (signUpAdmin as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolveSignUp = resolve; })
    );

    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'john@test.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('repeatPassword'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    resolveSignUp!({ success: true });

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  it('reducer default case returns state unchanged', () => {
    let capturedReducer: Function | null = null;
    const originalUseReducer = React.useReducer;
    const spy = jest.spyOn(React, 'useReducer').mockImplementation((reducer: any, initialState: any) => {
      capturedReducer = reducer;
      return originalUseReducer(reducer, initialState);
    });

    render(<SignUpForm />);
    spy.mockRestore();

    expect(capturedReducer).not.toBeNull();
    const state = { email: '', password: '', repeatPassword: '', firstName: '', lastName: '', error: null, fieldErrors: {}, isLoading: false };
    const result = capturedReducer!(state, { type: 'UNKNOWN_ACTION' });
    expect(result).toBe(state);
  });
});
