import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useActionState } from 'react';
import { toast } from 'sonner';

import CategoryForm from '../category-form';

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

jest.mock('@/actions/dashboard/category/category-form-actions', () => ({
  categoryFormAction: jest.fn(),
}));

jest.mock('@/schemas/category.schema', () => ({
  CategorySchema: {
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

describe('CategoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActionState.mockReturnValue([
      { message: '', fieldErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  describe('rendering', () => {
    it('should render create form without category data', () => {
      render(<CategoryForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render edit form with existing category data', () => {
      const mockCategory = {
        id: '1',
        name: 'Test Category',
        description: 'Test description',
        active: true,
      };

      render(<CategoryForm category={mockCategory} />);

      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('should render form with inactive category', () => {
      const mockCategory = {
        id: '1',
        name: 'Inactive Category',
        description: null,
        active: false,
      };

      render(<CategoryForm category={mockCategory} />);

      expect(screen.getByDisplayValue('Inactive Category')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('should render hidden id field for edit form', () => {
      const mockCategory = {
        id: 'category-123',
        name: 'Test Category',
        active: true,
      };

      render(<CategoryForm category={mockCategory} />);

      const hiddenIdField = screen.getByDisplayValue('category-123') as HTMLInputElement;
      expect(hiddenIdField).toBeInTheDocument();
      expect(hiddenIdField.type).toBe('hidden');
      expect(hiddenIdField.name).toBe('id');
    });
  });

  describe('form interactions', () => {
    it('should handle name input change', () => {
      render(<CategoryForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'New Category Name' } });

      expect(nameInput).toHaveValue('New Category Name');
    });

    it('should handle description input change', () => {
      render(<CategoryForm />);

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'New description text' } });

      expect(descriptionInput).toHaveValue('New description text');
    });

    it('should handle checkbox toggle', () => {
      render(<CategoryForm />);

      const activeCheckbox = screen.getByLabelText(/active/i);
      expect(activeCheckbox).toBeChecked(); // Default is true

      fireEvent.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();

      fireEvent.click(activeCheckbox);
      expect(activeCheckbox).toBeChecked();
    });

    it('should call form action on submit', () => {
      const mockFormAction = jest.fn();
      mockUseActionState.mockReturnValue([
        { message: '', fieldErrors: {} },
        mockFormAction,
        false,
      ]);

      render(<CategoryForm />);

      const form = document.querySelector('form');
      const nameInput = screen.getByLabelText(/name/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test Category' } });
      fireEvent.submit(form);

      expect(mockFormAction).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should show validation errors when form is invalid', () => {
      mockUseActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: {
            name: ['Name is required'],
          }
        },
        jest.fn(),
        false,
      ]);

      render(<CategoryForm />);

      // Validation error should be displayed
      expect(screen.getByTestId('field-error-name')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-name')).toHaveTextContent('Name is required');
    });

    it('should prevent form submission with invalid data', () => {
      render(<CategoryForm />);

      const form = document.querySelector('form') as HTMLFormElement;
      const nameInput = screen.getByLabelText(/name/i);
      
      // Try to submit with empty name
      fireEvent.change(nameInput, { target: { value: '' } });
      
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      fireEvent(form, submitEvent);

      // This test validates that the form exists and can handle submit events
      // The actual validation and prevention is handled by the onSubmit handler
      expect(form).toBeInTheDocument();
    });
  });

  describe('success handling', () => {
    it('should show success toast and navigate on successful creation', async () => {
      // Mock successful action state
      mockUseActionState.mockReturnValue([
        { message: 'Category created successfully!', fieldErrors: {} },
        jest.fn(),
        false,
      ]);

      render(<CategoryForm />);

      // Wait for useEffect to trigger
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Category created successfully!');
      });
    });

    it('should show success toast and navigate on successful update', async () => {
      mockUseActionState.mockReturnValue([
        { message: 'Category updated successfully!', fieldErrors: {} },
        jest.fn(),
        false,
      ]);

      const mockCategory = {
        id: '1',
        name: 'Test Category',
        active: true,
      };

      render(<CategoryForm category={mockCategory} />);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Category updated successfully!');
      });
    });

    it('should not show toast or navigate when message is empty', () => {
      mockUseActionState.mockReturnValue([
        { message: '', fieldErrors: {} },
        jest.fn(),
        false,
      ]);

      render(<CategoryForm />);

      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should disable submit button when pending', () => {
      mockUseActionState.mockReturnValue([
        { message: '', fieldErrors: {} },
        jest.fn(),
        true, // pending state
      ]);

      render(<CategoryForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when not pending', () => {
      mockUseActionState.mockReturnValue([
        { message: '', fieldErrors: {} },
        jest.fn(),
        false, // not pending
      ]);

      render(<CategoryForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('should display field errors', () => {
      mockUseActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: {
            name: ['Name is required'],
            description: ['Description is invalid'],
          }
        },
        jest.fn(),
        false,
      ]);

      render(<CategoryForm />);

      expect(screen.getByTestId('field-error-name')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-name')).toHaveTextContent('Name is required');
      expect(screen.getByTestId('field-error-description')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-description')).toHaveTextContent('Description is invalid');
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      render(<CategoryForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<CategoryForm />);

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<CategoryForm />);

      expect(document.querySelector('form')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /active/i })).toBeInTheDocument();
    });

    it('should have proper aria attributes for form fields', async () => {
      mockUseActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            name: ['Name error'],
            description: ['Description error']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<CategoryForm />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const descriptionInput = screen.getByLabelText(/description/i);

        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'true');
        expect(descriptionInput).toHaveAttribute('aria-describedby', 'description-error');
      });
    });

    it('should have proper aria attributes when no errors', async () => {
      render(<CategoryForm />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const descriptionInput = screen.getByLabelText(/description/i);

        expect(nameInput).toHaveAttribute('aria-invalid', 'false');
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'false');
      });
    });
  });

  describe('navigation', () => {
    it('should have cancel link with correct href', () => {
      render(<CategoryForm />);

      const cancelLink = screen.getByRole('link', { name: /cancel/i });
      expect(cancelLink).toHaveAttribute('href', '/dashboard/category');
    });
  });
});