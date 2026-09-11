jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => Object.assign((key: string) => key, { has: () => true })),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/error';
import { AppError } from '@/lib/errors';

describe('Error page', () => {
  it('traduce la clave que trae un AppError del servidor', () => {
    render(<ErrorPage error={new AppError('auth.sessionExpired')} reset={jest.fn()} />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('auth.sessionExpired')).toBeInTheDocument();
  });

  it('no deja pasar el texto crudo de Supabase y permite reintentar', () => {
    const mockReset = jest.fn();
    const error = new Error('duplicate key value violates unique constraint "branch_pkey"');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(screen.queryByText(/branch_pkey/)).not.toBeInTheDocument();
    expect(screen.getByText('unexpected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('retry'));
    expect(mockReset).toHaveBeenCalled();
  });
});
