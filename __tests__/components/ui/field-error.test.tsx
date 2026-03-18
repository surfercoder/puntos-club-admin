import { render, screen } from '@testing-library/react';
import FieldError from '@/components/ui/field-error';
import type { ActionState } from '@/lib/error-handler';

describe('FieldError', () => {
  it('renders the first error message for the given field', () => {
    const actionState: ActionState = {
      status: 'error',
      message: '',
      fieldErrors: {
        email: ['Email is required', 'Email must be valid'],
      },
    };

    render(<FieldError actionState={actionState} name="email" />);

    const errorElement = screen.getByText('Email is required');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.tagName).toBe('P');
    expect(errorElement).toHaveAttribute('id', 'email-error');
    expect(errorElement).toHaveClass('text-destructive', 'text-sm');
  });

  it('returns null when there is no error for the given field name', () => {
    const actionState: ActionState = {
      status: 'error',
      message: '',
      fieldErrors: {
        email: ['Email is required'],
      },
    };

    const { container } = render(<FieldError actionState={actionState} name="password" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when fieldErrors is empty', () => {
    const actionState: ActionState = {
      status: '',
      message: '',
      fieldErrors: {},
    };

    const { container } = render(<FieldError actionState={actionState} name="email" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when field errors array is undefined', () => {
    const actionState: ActionState = {
      status: 'error',
      message: '',
      fieldErrors: {
        email: undefined,
      },
    };

    const { container } = render(<FieldError actionState={actionState} name="email" />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when field errors array is empty', () => {
    const actionState: ActionState = {
      status: 'error',
      message: '',
      fieldErrors: {
        email: [],
      },
    };

    const { container } = render(<FieldError actionState={actionState} name="email" />);
    expect(container.innerHTML).toBe('');
  });
});
