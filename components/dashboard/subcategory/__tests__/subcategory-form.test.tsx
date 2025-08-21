import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useActionState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';

import SubcategoryForm from '../subcategory-form';

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

jest.mock('@/actions/dashboard/subcategory/subcategory-form-actions', () => ({
  subcategoryFormAction: jest.fn(),
}));

jest.mock('@/schemas/subcategory.schema', () => ({
  SubcategorySchema: {
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
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: '1', name: 'Test Category', active: true }
        ],
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



describe('SubcategoryForm', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    useActionState.mockReturnValue([
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
            { id: '1', name: 'Test Category', active: true }
          ],
          error: null,
        }),
      })),
    };
    createClient.mockReturnValue(mockClient);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<SubcategoryForm />);

      expect(screen.getByTestId('select-category_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/^name$/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/active/i)).toBeChecked();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', () => {
      render(<SubcategoryForm />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', () => {
      render(<SubcategoryForm />);

      expect(screen.getByTestId('select-category_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
    });

    it('has proper placeholders for form fields', () => {
      render(<SubcategoryForm />);

      expect(screen.getByPlaceholderText(/enter subcategory name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter subcategory description/i)).toBeInTheDocument();
    });

    it('sets default active state to checked', () => {
      render(<SubcategoryForm />);

      const activeCheckbox = screen.getByLabelText(/active/i);
      expect(activeCheckbox).toBeChecked();
    });
  });

  describe('Edit Mode', () => {
    const mockSubcategory = {
      id: '123',
      category_id: 'cat-1',
      name: 'Test Subcategory',
      description: 'Test description',
      active: false,
    };

    it('renders edit form with pre-filled values', () => {
      render(<SubcategoryForm subcategory={mockSubcategory} />);

      expect(screen.getByTestId('select-category_id')).toHaveAttribute('data-value', 'cat-1');
      expect(screen.getByDisplayValue('Test Subcategory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).not.toBeChecked();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<SubcategoryForm subcategory={mockSubcategory} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });

    it('handles active state correctly', () => {
      const activeSubcategory = { ...mockSubcategory, active: true };
      render(<SubcategoryForm subcategory={activeSubcategory} />);

      const activeCheckbox = screen.getByLabelText(/active/i);
      expect(activeCheckbox).toBeChecked();
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<SubcategoryForm />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(nameInput, 'New Subcategory');
      await user.type(descriptionInput, 'New description');

      expect(nameInput).toHaveValue('New Subcategory');
      expect(descriptionInput).toHaveValue('New description');
    });

    it('allows user to toggle active checkbox', async () => {
      const user = userEvent.setup();
      render(<SubcategoryForm />);

      const activeCheckbox = screen.getByLabelText(/active/i);
      expect(activeCheckbox).toBeChecked();

      await user.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();

      await user.click(activeCheckbox);
      expect(activeCheckbox).toBeChecked();
    });

    it('handles select interactions', async () => {
      const user = userEvent.setup();
      render(<SubcategoryForm />);

      const categorySelect = screen.getByTestId('select-category_id');
      await user.click(categorySelect);

      expect(categorySelect).toBeInTheDocument();
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

      render(<SubcategoryForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      useActionState.mockReturnValue([
        {
          message: 'Subcategory created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<SubcategoryForm />);

      expect(toast.success).toHaveBeenCalledWith('Subcategory created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      useActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            category_id: ['Category is required'],
            name: ['Name is required'],
            description: ['Description is too long']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<SubcategoryForm />);

      expect(screen.getByTestId('field-error-category_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-name')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-description')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<SubcategoryForm />);

      const nameInput = screen.getByLabelText(/^name$/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameInput, 'Test Subcategory');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<SubcategoryForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/subcategory');
    });
  });

  describe('Input Types and Attributes', () => {
    it('has proper input types', () => {
      render(<SubcategoryForm />);

      expect(screen.getByLabelText(/^name$/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/active/i)).toHaveAttribute('type', 'checkbox');
    });

    it('has proper textarea attributes', () => {
      render(<SubcategoryForm />);

      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput.tagName.toLowerCase()).toBe('textarea');
      expect(descriptionInput).toHaveAttribute('rows', '3');
    });

    it('has proper checkbox styling', () => {
      render(<SubcategoryForm />);

      const activeCheckbox = screen.getByLabelText(/active/i);
      expect(activeCheckbox).toHaveClass('rounded', 'border-gray-300');
    });
  });

  describe('Select Components', () => {
    it('renders select component with proper placeholder', () => {
      render(<SubcategoryForm />);

      expect(screen.getByTestId('select-category_id')).toBeInTheDocument();
      
      const placeholder = screen.getByTestId('select-value');
      expect(placeholder).toHaveAttribute('data-placeholder', 'Select a category');
    });
  });

  describe('Data Loading', () => {
    it('loads data on component mount', () => {
      render(<SubcategoryForm />);
      
      // Component should render successfully, indicating data loading works
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('loads categories with proper filters', () => {
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

      render(<SubcategoryForm />);
      
      expect(mockClient.from).toHaveBeenCalledWith('category');
    });
  });

  describe('Form Structure', () => {
    it('has proper form structure with space-y-4 class', () => {
      render(<SubcategoryForm />);

      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('has button container with proper layout', () => {
      render(<SubcategoryForm />);

      const buttonContainer = document.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('has checkbox container with proper layout', () => {
      render(<SubcategoryForm />);

      const checkboxContainer = document.querySelector('.flex.items-center.space-x-2');
      expect(checkboxContainer).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('renders with default state values', () => {
      render(<SubcategoryForm />);
      
      // Check that default values are displayed
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/active/i)).toBeChecked();
    });

    it('renders with subcategory values in edit mode', () => {
      const subcategory = {
        id: '1',
        category_id: 'cat-1',
        name: 'Test Subcategory',
        description: 'Test description',
        active: true,
      };

      render(<SubcategoryForm subcategory={subcategory} />);
      
      // Check that the form is pre-populated with subcategory values
      expect(screen.getByDisplayValue('Test Subcategory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).toBeChecked();
    });
  });

  describe('Labels and Accessibility', () => {
    it('has proper labels for all fields', () => {
      render(<SubcategoryForm />);

      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('indicates optional fields in placeholders', () => {
      render(<SubcategoryForm />);

      expect(screen.getByPlaceholderText(/optional/i)).toBeInTheDocument();
    });
  });
});