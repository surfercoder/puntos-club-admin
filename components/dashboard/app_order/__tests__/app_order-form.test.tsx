import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock all dependencies with simple implementations
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(() => [
    { message: '', fieldErrors: {} },
    jest.fn(),
    false,
  ]),
  useEffect: jest.fn((fn) => fn()),
  useState: jest.fn((initial) => [initial, jest.fn()]),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('@/actions/dashboard/app_order/app_order-form-actions', () => ({
  appOrderFormAction: jest.fn(),
}));

jest.mock('@/schemas/app_order.schema', () => ({
  AppOrderSchema: {
    parse: jest.fn(),
  },
}));

jest.mock('@/lib/error-handler', () => ({
  EMPTY_ACTION_STATE: { message: '', fieldErrors: {} },
  fromErrorToActionState: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, className, type, disabled, ...props }: Record<string, unknown> & { children?: React.ReactNode; asChild?: boolean; className?: string; type?: string; disabled?: boolean }) => {
    if (asChild) {
      return React.createElement('span', props, children);
    }
    return React.createElement('button', { type, disabled, className, ...props }, children);
  }
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: Record<string, unknown>) => {
    const { className, ...otherProps } = props;
    return React.createElement('input', { 
      type: 'text',
      'aria-invalid': 'false',
      ...otherProps,
      className
    });
  },
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: Record<string, unknown> & { children: React.ReactNode }) => React.createElement('label', props, children),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: Record<string, unknown>) => {
    const { className, ...otherProps } = props;
    return React.createElement('textarea', { 
      'aria-invalid': 'false',
      ...otherProps,
      className
    });
  },
}));

jest.mock('@/components/ui/field-error', () => ({
  __esModule: true,
  default: ({ actionState, name }: { actionState: { fieldErrors?: Record<string, string[]> }; name: string }) => {
    const message = actionState?.fieldErrors?.[name]?.[0];
    if (!message) return null;
    return React.createElement('span', { 
      'data-testid': `field-error-${name}`, 
      className: 'text-red-500 text-xs' 
    }, message);
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown> & { children: React.ReactNode; href: string }) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

import AppOrderForm from '../app_order-form';

import { useActionState } from 'react';
import { toast } from 'sonner';

describe('AppOrderForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useActionState as jest.Mock).mockReturnValue([
      { message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<AppOrderForm />);

      expect(screen.getByLabelText(/order number/i)).toHaveValue('');
      expect(screen.getByLabelText(/creation date/i)).toHaveValue('');
      expect(screen.getByLabelText(/total points/i)).toHaveValue(0);
      expect(screen.getByLabelText(/observations/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', () => {
      render(<AppOrderForm />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', () => {
      render(<AppOrderForm />);

      expect(screen.getByLabelText(/order number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/creation date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/total points/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/observations/i)).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const mockAppOrder = {
      id: '123',
      order_number: 'ORDER-001',
      creation_date: '2023-12-01T00:00:00.000Z',
      total_points: 500,
      observations: 'Test observations',
    };

    it('renders edit form with pre-filled values', () => {
      render(<AppOrderForm appOrder={mockAppOrder} />);

      expect(screen.getByDisplayValue('ORDER-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023-12-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test observations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<AppOrderForm appOrder={mockAppOrder} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });

    it('handles empty observations field', () => {
      const appOrderWithoutObservations = { ...mockAppOrder, observations: null };
      render(<AppOrderForm appOrder={appOrderWithoutObservations} />);
      
      expect(screen.getByLabelText(/observations/i)).toHaveValue('');
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<AppOrderForm />);

      const orderNumberInput = screen.getByLabelText(/order number/i);
      const creationDateInput = screen.getByLabelText(/creation date/i);
      const totalPointsInput = screen.getByLabelText(/total points/i);
      const observationsInput = screen.getByLabelText(/observations/i);

      await user.type(orderNumberInput, 'ORDER-002');
      await user.type(creationDateInput, '2024-01-15');
      await user.clear(totalPointsInput);
      await user.type(totalPointsInput, '750');
      await user.type(observationsInput, 'New observations');

      expect(orderNumberInput).toHaveValue('ORDER-002');
      expect(creationDateInput).toHaveValue('2024-01-15');
      expect(totalPointsInput).toHaveValue(750);
      expect(observationsInput).toHaveValue('New observations');
    });

    it('handles total points field with minimum constraint', () => {
      render(<AppOrderForm />);

      const totalPointsInput = screen.getByLabelText(/total points/i);
      expect(totalPointsInput).toHaveAttribute('min', '0');
      expect(totalPointsInput).toHaveAttribute('type', 'number');
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', () => {
      const mockFormAction = jest.fn();
      (useActionState as jest.Mock).mockReturnValue([
        { message: '', fieldErrors: {} },
        mockFormAction,
        true, // pending = true
      ]);

      render(<AppOrderForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      (useActionState as jest.Mock).mockReturnValue([
        {
          message: 'App order created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<AppOrderForm />);

      expect(toast.success).toHaveBeenCalledWith('App order created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      (useActionState as jest.Mock).mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            order_number: ['Order number is required'],
            creation_date: ['Creation date is required'],
            total_points: ['Total points must be positive']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<AppOrderForm />);

      expect(screen.getByTestId('field-error-order_number')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-creation_date')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-total_points')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<AppOrderForm />);

      const orderNumberInput = screen.getByLabelText(/order number/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(orderNumberInput, 'ORDER-003');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<AppOrderForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/app_order');
    });
  });

  describe('Date Formatting', () => {
    it('formats date correctly for input field', () => {
      const mockAppOrder = {
        id: '123',
        order_number: 'ORDER-001',
        creation_date: '2023-12-01T10:30:45.123Z',
        total_points: 500,
        observations: 'Test observations',
      };

      render(<AppOrderForm appOrder={mockAppOrder} />);

      expect(screen.getByDisplayValue('2023-12-01')).toBeInTheDocument();
    });

    it('handles empty date field', () => {
      const mockAppOrder = {
        id: '123',
        order_number: 'ORDER-001',
        creation_date: '',
        total_points: 500,
        observations: 'Test observations',
      };

      render(<AppOrderForm appOrder={mockAppOrder} />);

      const creationDateInput = screen.getByLabelText(/creation date/i);
      expect(creationDateInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria attributes for form fields', () => {
      (useActionState as jest.Mock).mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            order_number: ['Order number error'],
            total_points: ['Total points error']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<AppOrderForm />);

      const orderNumberInput = screen.getByLabelText(/order number/i);
      const totalPointsInput = screen.getByLabelText(/total points/i);

      expect(orderNumberInput).toHaveAttribute('aria-invalid', 'true');
      expect(orderNumberInput).toHaveAttribute('aria-describedby', 'order_number-error');
      expect(totalPointsInput).toHaveAttribute('aria-invalid', 'true');
      expect(totalPointsInput).toHaveAttribute('aria-describedby', 'total_points-error');
    });

    it('has proper aria attributes when no errors', () => {
      render(<AppOrderForm />);

      const orderNumberInput = screen.getByLabelText(/order number/i);
      const creationDateInput = screen.getByLabelText(/creation date/i);
      const totalPointsInput = screen.getByLabelText(/total points/i);
      const observationsInput = screen.getByLabelText(/observations/i);

      expect(orderNumberInput).toHaveAttribute('aria-invalid', 'false');
      expect(creationDateInput).toHaveAttribute('aria-invalid', 'false');
      expect(totalPointsInput).toHaveAttribute('aria-invalid', 'false');
      expect(observationsInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper input types', () => {
      render(<AppOrderForm />);

      expect(screen.getByLabelText(/order number/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/creation date/i)).toHaveAttribute('type', 'date');
      expect(screen.getByLabelText(/total points/i)).toHaveAttribute('type', 'number');
    });
  });
});