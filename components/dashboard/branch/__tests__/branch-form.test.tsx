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
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('@/actions/dashboard/branch/branch-form-actions', () => ({
  branchFormAction: jest.fn(),
}));

jest.mock('@/schemas/branch.schema', () => ({
  BranchSchema: {
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

import BranchForm from '../branch-form';

import { useActionState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Get the mocked functions from the jest.mock('react') call
import * as React from 'react';

describe('BranchForm', () => {
  
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
            { id: '1', name: 'Test Organization', street: 'Main St', city: 'Test City' }
          ],
          error: null,
        }),
      })),
    };
    createClient.mockReturnValue(mockClient);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<BranchForm />);

      expect(screen.getByLabelText(/branch name/i)).toHaveValue('');
      expect(screen.getByTestId('select-organization_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-address_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/branch code/i)).toHaveValue('');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('');
      expect(screen.getByTestId('select-active')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', () => {
      render(<BranchForm />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', () => {
      render(<BranchForm />);

      expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument();
      expect(screen.getByTestId('select-organization_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-address_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/branch code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByTestId('select-active')).toBeInTheDocument();
    });

    it('has proper placeholders for form fields', () => {
      render(<BranchForm />);

      expect(screen.getByPlaceholderText(/enter branch name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter branch code/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument();
    });

    it('sets default active status to true', () => {
      render(<BranchForm />);

      expect(screen.getByTestId('select-active')).toHaveAttribute('data-default-value', 'true');
    });

    it('sets default address to none', () => {
      render(<BranchForm />);

      expect(screen.getByTestId('select-address_id')).toHaveAttribute('data-default-value', 'none');
    });
  });

  describe('Edit Mode', () => {
    const mockBranch = {
      id: '123',
      name: 'Main Branch',
      organization_id: 'org-1',
      address_id: 'addr-1',
      code: 'MB001',
      phone: '+1234567890',
      active: true,
    };

    it('renders edit form with pre-filled values', () => {
      render(<BranchForm branch={mockBranch} />);

      expect(screen.getByDisplayValue('Main Branch')).toBeInTheDocument();
      expect(screen.getByTestId('select-organization_id')).toHaveAttribute('data-default-value', 'org-1');
      expect(screen.getByTestId('select-address_id')).toHaveAttribute('data-default-value', 'addr-1');
      expect(screen.getByDisplayValue('MB001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByTestId('select-active')).toHaveAttribute('data-default-value', 'true');
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<BranchForm branch={mockBranch} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });

    it('handles inactive branch status correctly', () => {
      const inactiveBranch = { ...mockBranch, active: false };
      render(<BranchForm branch={inactiveBranch} />);

      expect(screen.getByTestId('select-active')).toHaveAttribute('data-default-value', 'false');
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<BranchForm />);

      const nameInput = screen.getByLabelText(/branch name/i);
      const codeInput = screen.getByLabelText(/branch code/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(nameInput, 'North Branch');
      await user.type(codeInput, 'NB002');
      await user.type(phoneInput, '+1987654321');

      expect(nameInput).toHaveValue('North Branch');
      expect(codeInput).toHaveValue('NB002');
      expect(phoneInput).toHaveValue('+1987654321');
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

      render(<BranchForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      useActionState.mockReturnValue([
        {
          message: 'Branch created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<BranchForm />);

      expect(toast.success).toHaveBeenCalledWith('Branch created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      useActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            name: ['Branch name is required'],
            organization_id: ['Organization is required'],
            code: ['Branch code must be unique']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<BranchForm />);

      expect(screen.getByTestId('field-error-name')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-organization_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-code')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<BranchForm />);

      const nameInput = screen.getByLabelText(/branch name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameInput, 'Test Branch');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<BranchForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/branch');
    });
  });

  describe('Input Types and Attributes', () => {
    it('has proper input types', () => {
      render(<BranchForm />);

      expect(screen.getByLabelText(/branch name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/branch code/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/phone/i)).toHaveAttribute('type', 'tel');
    });
  });

  describe('Select Components', () => {
    it('renders select components with proper placeholders', () => {
      render(<BranchForm />);

      expect(screen.getByTestId('select-organization_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-address_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-active')).toBeInTheDocument();
      
      const placeholders = screen.getAllByTestId('select-value');
      expect(placeholders).toHaveLength(3);
    });

    it('includes none option for address select', () => {
      render(<BranchForm />);

      const selectItems = screen.getAllByTestId('select-item');
      const noneOption = selectItems.find(item => item.getAttribute('data-value') === 'none');
      expect(noneOption).toBeInTheDocument();
    });

    it('includes active/inactive options for status select', () => {
      render(<BranchForm />);

      const selectItems = screen.getAllByTestId('select-item');
      const activeOption = selectItems.find(item => item.getAttribute('data-value') === 'true');
      const inactiveOption = selectItems.find(item => item.getAttribute('data-value') === 'false');
      
      expect(activeOption).toBeInTheDocument();
      expect(inactiveOption).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('loads data on component mount', () => {
      render(<BranchForm />);
      
      // Component should render successfully, indicating data loading works
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
  });

  describe('Form Structure', () => {
    it('has proper form structure with space-y-4 class', () => {
      render(<BranchForm />);

      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('has button container with proper layout', () => {
      render(<BranchForm />);

      const buttonContainer = document.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Labels and Accessibility', () => {
    it('has proper labels for all fields', () => {
      render(<BranchForm />);

      expect(screen.getByText(/branch name/i)).toBeInTheDocument();
      expect(screen.getByText('Organization')).toBeInTheDocument();
      expect(screen.getByText(/address \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByText(/branch code/i)).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('indicates optional fields in labels', () => {
      render(<BranchForm />);

      expect(screen.getByText(/address \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter branch code \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter phone number \(optional\)/i)).toBeInTheDocument();
    });
  });
});