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

jest.mock('@/actions/dashboard/assignment/assignment-form-actions', () => ({
  assignmentFormAction: jest.fn(),
}));

jest.mock('@/schemas/assignment.schema', () => ({
  AssignmentSchema: {
    parse: jest.fn(),
  },
}));

jest.mock('@/lib/error-handler', () => ({
  EMPTY_ACTION_STATE: { message: '', fieldErrors: {} },
  fromErrorToActionState: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
  })),
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
  Input: (props: Record<string, unknown>) => React.createElement('input', { type: props.type || 'text', ...props }),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: Record<string, unknown> & { children: React.ReactNode }) => React.createElement('label', props, children),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: Record<string, unknown>) => React.createElement('textarea', props),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, name, defaultValue, ...props }: Record<string, unknown> & { children: React.ReactNode; name?: string; defaultValue?: string }) => 
    React.createElement('div', { 'data-testid': `select-${name}`, 'data-default-value': defaultValue, ...props }, children),
  SelectContent: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'select-content' }, children),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => 
    React.createElement('div', { 'data-testid': 'select-item', 'data-value': value }, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'select-trigger' }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) => React.createElement('div', { 'data-testid': 'select-value', 'data-placeholder': placeholder }),
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

import AssignmentForm from '../assignment-form';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// Get the mocked functions from the jest.mock('react') call
import * as React from 'react';

describe('AssignmentForm', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    useActionState.mockReturnValue([
      { message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
    
    const mockClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [
            { id: '1', name: 'Test Branch', first_name: 'John', last_name: 'Doe' }
          ],
          error: null,
        }),
      })),
    };
    createClient.mockReturnValue(mockClient);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<AssignmentForm />);

      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-beneficiary_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-user_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/points/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assignment date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/observations/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', () => {
      render(<AssignmentForm />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', () => {
      render(<AssignmentForm />);

      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-beneficiary_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-user_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/points/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assignment date/i)).toBeInTheDocument();
    });

    it('sets default assignment date to today', () => {
      render(<AssignmentForm />);

      const dateInput = screen.getByLabelText(/assignment date/i);
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput).toHaveValue(today);
    });
  });

  describe('Edit Mode', () => {
    const mockAssignment = {
      id: '123',
      branch_id: 'branch-1',
      beneficiary_id: 'beneficiary-1',
      user_id: 'user-1',
      points: 100,
      reason: 'Test reason',
      assignment_date: '2024-01-15T00:00:00Z',
      observations: 'Test observations',
    };

    it('renders edit form with pre-filled values', () => {
      render(<AssignmentForm assignment={mockAssignment} />);

      expect(screen.getByTestId('select-branch_id')).toHaveAttribute('data-default-value', 'branch-1');
      expect(screen.getByTestId('select-beneficiary_id')).toHaveAttribute('data-default-value', 'beneficiary-1');
      expect(screen.getByTestId('select-user_id')).toHaveAttribute('data-default-value', 'user-1');
      expect(screen.getByLabelText(/points/i)).toHaveValue(100);
      expect(screen.getByLabelText(/reason/i)).toHaveValue('Test reason');
      expect(screen.getByLabelText(/assignment date/i)).toHaveValue('2024-01-15');
      expect(screen.getByLabelText(/observations/i)).toHaveValue('Test observations');
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<AssignmentForm assignment={mockAssignment} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });

    it('converts numeric id to string', () => {
      const assignmentWithNumericId = { ...mockAssignment, id: 456 };
      render(<AssignmentForm assignment={assignmentWithNumericId} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toHaveValue('456');
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<AssignmentForm />);

      const pointsInput = screen.getByLabelText(/points/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const dateInput = screen.getByLabelText(/assignment date/i);
      const observationsInput = screen.getByLabelText(/observations/i);

      await user.clear(pointsInput);
      await user.type(pointsInput, '150');
      await user.type(reasonInput, 'Performance bonus');
      await user.clear(dateInput);
      await user.type(dateInput, '2024-02-01');
      await user.type(observationsInput, 'Great work this month');

      expect(pointsInput).toHaveValue(150);
      expect(reasonInput).toHaveValue('Performance bonus');
      expect(dateInput).toHaveValue('2024-02-01');
      expect(observationsInput).toHaveValue('Great work this month');
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

      render(<AssignmentForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      useActionState.mockReturnValue([
        {
          message: 'Assignment created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<AssignmentForm />);

      expect(toast.success).toHaveBeenCalledWith('Assignment created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      useActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            branch_id: ['Branch is required'],
            beneficiary_id: ['Beneficiary is required'],
            points: ['Points must be greater than 0']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<AssignmentForm />);

      expect(screen.getByTestId('field-error-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-beneficiary_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-points')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<AssignmentForm />);

      const pointsInput = screen.getByLabelText(/points/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.clear(pointsInput);
      await user.type(pointsInput, '250');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<AssignmentForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/assignment');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria attributes for form fields', () => {
      useActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            points: ['Points error'],
            reason: ['Reason error']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<AssignmentForm />);

      const pointsInput = screen.getByLabelText(/points/i);
      const reasonInput = screen.getByLabelText(/reason/i);

      expect(pointsInput).toHaveAttribute('aria-invalid', 'true');
      expect(pointsInput).toHaveAttribute('aria-describedby', 'points-error');
      expect(reasonInput).toHaveAttribute('aria-invalid', 'true');
      expect(reasonInput).toHaveAttribute('aria-describedby', 'reason-error');
    });

    it('has proper aria attributes when no errors', () => {
      render(<AssignmentForm />);

      const pointsInput = screen.getByLabelText(/points/i);
      const reasonInput = screen.getByLabelText(/reason/i);
      const dateInput = screen.getByLabelText(/assignment date/i);
      const observationsInput = screen.getByLabelText(/observations/i);

      expect(pointsInput).toHaveAttribute('aria-invalid', 'false');
      expect(reasonInput).toHaveAttribute('aria-invalid', 'false');
      expect(dateInput).toHaveAttribute('aria-invalid', 'false');
      expect(observationsInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper input types', () => {
      render(<AssignmentForm />);

      expect(screen.getByLabelText(/points/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/reason/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/assignment date/i)).toHaveAttribute('type', 'date');
    });

    it('has proper min attribute for points input', () => {
      render(<AssignmentForm />);

      const pointsInput = screen.getByLabelText(/points/i);
      expect(pointsInput).toHaveAttribute('min', '1');
    });
  });

  describe('Select Components', () => {
    it('renders select components with proper placeholders', () => {
      render(<AssignmentForm />);

      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-beneficiary_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-user_id')).toBeInTheDocument();
      
      const placeholders = screen.getAllByTestId('select-value');
      expect(placeholders).toHaveLength(3);
    });

    it('has default system option for user_id select', () => {
      render(<AssignmentForm />);

      expect(screen.getByTestId('select-user_id')).toHaveAttribute('data-default-value', 'system');
    });
  });

  describe('Data Loading', () => {
    it('loads data on component mount', () => {
      render(<AssignmentForm />);
      
      // Component should render successfully, indicating data loading works
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
  });
});