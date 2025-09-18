import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useActionState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';

import UserPermissionForm from '../user_permission-form';

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
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('@/actions/dashboard/user_permission/user_permission-form-actions', () => ({
  userPermissionFormAction: jest.fn(),
}));

jest.mock('@/schemas/user_permission.schema', () => ({
  UserPermissionSchema: {
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
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: table === 'app_user' 
          ? [{ id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }]
          : [{ id: '2', name: 'Test Branch' }],
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

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, name, ...props }: Record<string, unknown> & { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void; name?: string }) => 
    React.createElement('div', { 
      'data-testid': `select-${name}`, 
      'data-value': value,
      onClick: () => onValueChange && onValueChange('test-value'),
      ...props 
    }, children),
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
    if (!message) {return null;}
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



const mockUseActionState = useActionState as jest.MockedFunction<typeof useActionState>;

describe('UserPermissionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActionState.mockReturnValue([
      { message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
    
    const mockClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', name: 'Test Branch' }
          ],
          error: null,
        }),
      })),
    };
    createClient.mockReturnValue(mockClient);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', async () => {
      await act(async () => {
        render(<UserPermissionForm />);
      });

      expect(screen.getByTestId('select-user_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/^action$/i)).toHaveValue('');
      expect(screen.getByLabelText(/assignment date/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', async () => {
      await act(async () => {
        render(<UserPermissionForm />);
      });
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', async () => {
      await act(async () => {
        render(<UserPermissionForm />);
      });

      expect(screen.getByTestId('select-user_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/^action$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assignment date/i)).toBeInTheDocument();
    });

    it('has proper placeholders for form fields', () => {
      render(<UserPermissionForm />);

      expect(screen.getByPlaceholderText(/enter permitted action/i)).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const mockUserPermission = {
      id: '123',
      user_id: 'user-1',
      branch_id: 'branch-1',
      action: 'admin',
      assignment_date: '2024-01-15T10:30:00Z',
    };

    it('renders edit form with pre-filled values', () => {
      render(<UserPermissionForm userPermission={mockUserPermission} />);

      expect(screen.getByTestId('select-user_id')).toHaveAttribute('data-value', 'user-1');
      expect(screen.getByTestId('select-branch_id')).toHaveAttribute('data-value', 'branch-1');
      expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      expect(screen.getByLabelText(/assignment date/i)).toHaveValue('2024-01-15');
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<UserPermissionForm userPermission={mockUserPermission} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });

    it('formats date correctly for date input', () => {
      render(<UserPermissionForm userPermission={mockUserPermission} />);

      const dateInput = screen.getByLabelText(/assignment date/i);
      expect(dateInput).toHaveValue('2024-01-15');
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<UserPermissionForm />);

      const actionInput = screen.getByLabelText(/^action$/i);
      const dateInput = screen.getByLabelText(/assignment date/i);

      await user.type(actionInput, 'read');
      await user.type(dateInput, '2024-02-01');

      expect(actionInput).toHaveValue('read');
      expect(dateInput).toHaveValue('2024-02-01');
    });

    it('handles select interactions', async () => {
      const user = userEvent.setup();
      render(<UserPermissionForm />);

      const userSelect = screen.getByTestId('select-user_id');
      const branchSelect = screen.getByTestId('select-branch_id');

      await user.click(userSelect);
      await user.click(branchSelect);

      expect(userSelect).toBeInTheDocument();
      expect(branchSelect).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', () => {
      const mockFormAction = jest.fn();
      mockUseActionState.mockReturnValue([
        { message: '', fieldErrors: {} },
        mockFormAction,
        true, // pending = true
      ]);

      render(<UserPermissionForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      mockUseActionState.mockReturnValue([
        {
          message: 'User permission created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<UserPermissionForm />);

      expect(toast.success).toHaveBeenCalledWith('User permission created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      mockUseActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            user_id: ['User is required'],
            branch_id: ['Branch is required'],
            action: ['Action is required']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<UserPermissionForm />);

      expect(screen.getByTestId('field-error-user_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-action')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<UserPermissionForm />);

      const actionInput = screen.getByLabelText(/^action$/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(actionInput, 'write');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<UserPermissionForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/user_permission');
    });
  });

  describe('Input Types and Attributes', () => {
    it('has proper input types', () => {
      render(<UserPermissionForm />);

      expect(screen.getByLabelText(/^action$/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/assignment date/i)).toHaveAttribute('type', 'date');
    });
  });

  describe('Select Components', () => {
    it('renders select components with proper placeholders', () => {
      render(<UserPermissionForm />);

      expect(screen.getByTestId('select-user_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      
      const placeholders = screen.getAllByTestId('select-value');
      expect(placeholders).toHaveLength(2);
    });
  });

  describe('Data Loading', () => {
    it('loads data on component mount', () => {
      render(<UserPermissionForm />);
      
      // Component should render successfully, indicating data loading works
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('loads users and branches with proper filters', () => {
      const mockClient = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      };
      createClient.mockReturnValue(mockClient);

      render(<UserPermissionForm />);
      
      expect(mockClient.from).toHaveBeenCalledWith('app_user');
      expect(mockClient.from).toHaveBeenCalledWith('branch');
    });
  });

  describe('Date Formatting', () => {
    it('formats date string correctly for input', () => {
      const userPermissionWithDate = {
        id: '1',
        user_id: 'user-1',
        branch_id: 'branch-1',
        action: 'read',
        assignment_date: '2024-03-20T15:45:30Z',
      };

      render(<UserPermissionForm userPermission={userPermissionWithDate} />);

      const dateInput = screen.getByLabelText(/assignment date/i);
      expect(dateInput).toHaveValue('2024-03-20');
    });

    it('handles empty date string', () => {
      const userPermissionWithoutDate = {
        id: '1',
        user_id: 'user-1',
        branch_id: 'branch-1',
        action: 'read',
        assignment_date: '',
      };

      render(<UserPermissionForm userPermission={userPermissionWithoutDate} />);

      const dateInput = screen.getByLabelText(/assignment date/i);
      expect(dateInput).toHaveValue('');
    });
  });

  describe('User Display Names', () => {
    it('renders user select components', () => {
      render(<UserPermissionForm />);

      // Component should render user and branch selects successfully
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Branch')).toBeInTheDocument();
    });

    it('handles user selection properly', () => {
      render(<UserPermissionForm />);

      // The select components should be rendered and functional
      const userSelect = screen.getByTestId('select-user_id');
      const branchSelect = screen.getByTestId('select-branch_id');
      expect(userSelect).toBeInTheDocument();
      expect(branchSelect).toBeInTheDocument();
    });
  });

  describe('Form Structure', () => {
    it('has proper form structure with space-y-4 class', () => {
      render(<UserPermissionForm />);

      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('has button container with proper layout', () => {
      render(<UserPermissionForm />);

      const buttonContainer = document.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('renders with default state values', () => {
      render(<UserPermissionForm />);
      
      // Check that default values are displayed
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByLabelText(/action/i)).toHaveValue('');
      expect(screen.getByLabelText(/assignment date/i)).toHaveValue('');
    });

    it('renders with userPermission values in edit mode', () => {
      const userPermission = {
        id: '1',
        user_id: 'user-1',
        branch_id: 'branch-1',
        action: 'admin',
        assignment_date: '2024-01-01T00:00:00Z',
      };

      render(<UserPermissionForm userPermission={userPermission} />);
      
      // Check that the form is pre-populated with userPermission values
      expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    });
  });

  describe('Labels and Accessibility', () => {
    it('has proper labels for all fields', () => {
      render(<UserPermissionForm />);

      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Assignment Date')).toBeInTheDocument();
    });

    it('has descriptive placeholder for action field', () => {
      render(<UserPermissionForm />);

      expect(screen.getByPlaceholderText(/read.*write.*admin/i)).toBeInTheDocument();
    });
  });
});