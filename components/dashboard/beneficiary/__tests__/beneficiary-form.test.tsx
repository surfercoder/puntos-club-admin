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

jest.mock('@/actions/dashboard/beneficiary/beneficiary-form-actions', () => ({
  beneficiaryFormAction: jest.fn(),
}));

jest.mock('@/schemas/beneficiary.schema', () => ({
  BeneficiarySchema: {
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
      type: props.type || 'text',
      'aria-invalid': 'false',
      ...otherProps,
      className
    });
  },
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: Record<string, unknown> & { children: React.ReactNode }) => React.createElement('label', props, children),
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

import BeneficiaryForm from '../beneficiary-form';

import { useActionState } from 'react';
import { toast } from 'sonner';

describe('BeneficiaryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useActionState.mockReturnValue([
      { message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<BeneficiaryForm />);

      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('');
      expect(screen.getByLabelText(/document id/i)).toHaveValue('');
      expect(screen.getByLabelText(/available points/i)).toHaveValue(0);
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', () => {
      render(<BeneficiaryForm />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', () => {
      render(<BeneficiaryForm />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/document id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/available points/i)).toBeInTheDocument();
    });

    it('has proper placeholders for form fields', () => {
      render(<BeneficiaryForm />);

      expect(screen.getByPlaceholderText(/enter first name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter last name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter document id/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter available points/i)).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const mockBeneficiary = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      document_id: 'DOC123456',
      available_points: 150,
    };

    it('renders edit form with pre-filled values', () => {
      render(<BeneficiaryForm beneficiary={mockBeneficiary} />);

      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('DOC123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<BeneficiaryForm beneficiary={mockBeneficiary} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<BeneficiaryForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const documentIdInput = screen.getByLabelText(/document id/i);
      const pointsInput = screen.getByLabelText(/available points/i);

      await user.type(firstNameInput, 'Jane');
      await user.type(lastNameInput, 'Smith');
      await user.type(emailInput, 'jane.smith@example.com');
      await user.type(phoneInput, '+1987654321');
      await user.type(documentIdInput, 'DOC789012');
      await user.clear(pointsInput);
      await user.type(pointsInput, '200');

      expect(firstNameInput).toHaveValue('Jane');
      expect(lastNameInput).toHaveValue('Smith');
      expect(emailInput).toHaveValue('jane.smith@example.com');
      expect(phoneInput).toHaveValue('+1987654321');
      expect(documentIdInput).toHaveValue('DOC789012');
      expect(pointsInput).toHaveValue(200);
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', () => {
      const mockFormAction = jest.fn();
      useActionState.mockReturnValue([
        { message: '', fieldErrors: {} },
        mockFormAction,
        true, // pending = true
      ]);

      render(<BeneficiaryForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      useActionState.mockReturnValue([
        {
          message: 'Beneficiary created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<BeneficiaryForm />);

      expect(toast.success).toHaveBeenCalledWith('Beneficiary created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      useActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            first_name: ['First name is required'],
            email: ['Invalid email format'],
            available_points: ['Points must be a positive number']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<BeneficiaryForm />);

      expect(screen.getByTestId('field-error-first_name')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-email')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-available_points')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<BeneficiaryForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(firstNameInput, 'Test User');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<BeneficiaryForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/beneficiary');
    });
  });

  describe('Input Types and Attributes', () => {
    it('has proper input types', () => {
      render(<BeneficiaryForm />);

      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('type', 'tel');
      expect(screen.getByLabelText(/document id/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/available points/i)).toHaveAttribute('type', 'number');
    });

    it('has proper attributes for number input', () => {
      render(<BeneficiaryForm />);

      const pointsInput = screen.getByLabelText(/available points/i);
      expect(pointsInput).toHaveAttribute('min', '0');
      expect(pointsInput).toHaveAttribute('step', '1');
    });
  });

  describe('Default Values', () => {
    it('has default value of 0 for available points in create mode', () => {
      render(<BeneficiaryForm />);

      const pointsInput = screen.getByLabelText(/available points/i);
      expect(pointsInput).toHaveValue(0);
    });

    it('preserves beneficiary available points in edit mode', () => {
      const beneficiary = {
        id: '1',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '123456789',
        document_id: 'DOC123',
        available_points: 500,
      };

      render(<BeneficiaryForm beneficiary={beneficiary} />);

      const pointsInput = screen.getByLabelText(/available points/i);
      expect(pointsInput).toHaveValue(500);
    });
  });

  describe('Form Structure', () => {
    it('has proper form structure with space-y-4 class', () => {
      render(<BeneficiaryForm />);

      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('has button container with proper layout', () => {
      render(<BeneficiaryForm />);

      const buttonContainer = document.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria attributes for form fields', () => {
      (useActionState as jest.Mock).mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            first_name: ['First name error'],
            email: ['Email error'],
            available_points: ['Points error']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<BeneficiaryForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const pointsInput = screen.getByLabelText(/available points/i);

      expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
      expect(firstNameInput).toHaveAttribute('aria-describedby', 'first_name-error');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      expect(pointsInput).toHaveAttribute('aria-invalid', 'true');
      expect(pointsInput).toHaveAttribute('aria-describedby', 'available_points-error');
    });

    it('has proper aria attributes when no errors', () => {
      render(<BeneficiaryForm />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const documentInput = screen.getByLabelText(/document id/i);
      const pointsInput = screen.getByLabelText(/available points/i);

      expect(firstNameInput).toHaveAttribute('aria-invalid', 'false');
      expect(lastNameInput).toHaveAttribute('aria-invalid', 'false');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(phoneInput).toHaveAttribute('aria-invalid', 'false');
      expect(documentInput).toHaveAttribute('aria-invalid', 'false');
      expect(pointsInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper input types', () => {
      render(<BeneficiaryForm />);

      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('type', 'tel');
      expect(screen.getByLabelText(/available points/i)).toHaveAttribute('type', 'number');
    });
  });
});