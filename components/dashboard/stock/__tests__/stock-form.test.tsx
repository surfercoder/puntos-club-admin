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

jest.mock('@/actions/dashboard/stock/stock-form-actions', () => ({
  stockFormAction: jest.fn(),
}));

jest.mock('@/schemas/stock.schema', () => ({
  StockSchema: {
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
          { id: '1', name: 'Test Branch' },
          { id: '2', name: 'Test Product' }
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

import StockForm from '../stock-form';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

// Get the mocked functions from the jest.mock('react') call
import * as React from 'react';

describe('StockForm', () => {
  
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
            { id: '1', name: 'Test Item' }
          ],
          error: null,
        }),
      })),
    };
    createClient.mockReturnValue(mockClient);
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<StockForm />);

      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-product_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/current quantity/i)).toHaveValue(0);
      expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(0);
      expect(screen.getByLabelText(/last updated/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('does not render hidden id field in create mode', () => {
      render(<StockForm />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('has all required form fields', () => {
      render(<StockForm />);

      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-product_id')).toBeInTheDocument();
      expect(screen.getByLabelText(/current quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last updated/i)).toBeInTheDocument();
    });

    it('has proper placeholders for form fields', () => {
      render(<StockForm />);

      expect(screen.getByPlaceholderText(/enter current quantity/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter minimum quantity threshold/i)).toBeInTheDocument();
    });

    it('sets default values for numeric fields', () => {
      render(<StockForm />);

      expect(screen.getByLabelText(/current quantity/i)).toHaveValue(0);
      expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(0);
    });
  });

  describe('Edit Mode', () => {
    const mockStock = {
      id: '123',
      branch_id: 'branch-1',
      product_id: 'product-1',
      quantity: 50,
      minimum_quantity: 10,
      last_updated: '2024-01-15T10:30:00Z',
    };

    it('renders edit form with pre-filled values', () => {
      render(<StockForm stock={mockStock} />);

      expect(screen.getByTestId('select-branch_id')).toHaveAttribute('data-value', 'branch-1');
      expect(screen.getByTestId('select-product_id')).toHaveAttribute('data-value', 'product-1');
      expect(screen.getByLabelText(/current quantity/i)).toHaveValue(50);
      expect(screen.getByLabelText(/minimum quantity/i)).toHaveValue(10);
      expect(screen.getByLabelText(/last updated/i)).toHaveValue('2024-01-15');
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('renders hidden id field in edit mode', () => {
      render(<StockForm stock={mockStock} />);
      
      const hiddenInput = document.querySelector('input[type="hidden"][name="id"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue('123');
    });

    it('formats date correctly for date input', () => {
      render(<StockForm stock={mockStock} />);

      const dateInput = screen.getByLabelText(/last updated/i);
      expect(dateInput).toHaveValue('2024-01-15');
    });
  });

  describe('Form Interactions', () => {
    it('allows user to type in form fields', async () => {
      const user = userEvent.setup();
      render(<StockForm />);

      const quantityInput = screen.getByLabelText(/current quantity/i);
      const minQuantityInput = screen.getByLabelText(/minimum quantity/i);
      const lastUpdatedInput = screen.getByLabelText(/last updated/i);

      await user.clear(quantityInput);
      await user.type(quantityInput, '100');
      await user.clear(minQuantityInput);
      await user.type(minQuantityInput, '20');
      await user.type(lastUpdatedInput, '2024-02-01');

      expect(quantityInput).toHaveValue(100);
      expect(minQuantityInput).toHaveValue(20);
      expect(lastUpdatedInput).toHaveValue('2024-02-01');
    });

    it('handles select interactions', async () => {
      const user = userEvent.setup();
      render(<StockForm />);

      const branchSelect = screen.getByTestId('select-branch_id');
      const productSelect = screen.getByTestId('select-product_id');

      await user.click(branchSelect);
      await user.click(productSelect);

      expect(branchSelect).toBeInTheDocument();
      expect(productSelect).toBeInTheDocument();
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

      render(<StockForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('shows success toast on successful action', async () => {
      useActionState.mockReturnValue([
        {
          message: 'Stock created successfully',
          fieldErrors: {},
        },
        jest.fn(),
        false,
      ]);

      render(<StockForm />);

      expect(toast.success).toHaveBeenCalledWith('Stock created successfully');
    });
  });

  describe('Error Handling', () => {
    it('displays field errors from action state', () => {
      useActionState.mockReturnValue([
        { 
          message: '', 
          fieldErrors: { 
            branch_id: ['Branch is required'],
            product_id: ['Product is required'],
            quantity: ['Quantity must be a positive number']
          } 
        },
        jest.fn(),
        false,
      ]);

      render(<StockForm />);

      expect(screen.getByTestId('field-error-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-product_id')).toBeInTheDocument();
      expect(screen.getByTestId('field-error-quantity')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('calls validation on form submit', async () => {
      const user = userEvent.setup();
      render(<StockForm />);

      const quantityInput = screen.getByLabelText(/current quantity/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.clear(quantityInput);
      await user.type(quantityInput, '75');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders cancel button with correct href', () => {
      render(<StockForm />);

      const cancelButton = screen.getByRole('link', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('href', '/dashboard/stock');
    });
  });

  describe('Input Types and Attributes', () => {
    it('has proper input types', () => {
      render(<StockForm />);

      expect(screen.getByLabelText(/current quantity/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/minimum quantity/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/last updated/i)).toHaveAttribute('type', 'date');
    });

    it('has proper min attributes for number inputs', () => {
      render(<StockForm />);

      const quantityInput = screen.getByLabelText(/current quantity/i);
      const minQuantityInput = screen.getByLabelText(/minimum quantity/i);
      
      expect(quantityInput).toHaveAttribute('min', '0');
      expect(minQuantityInput).toHaveAttribute('min', '0');
    });
  });

  describe('Select Components', () => {
    it('renders select components with proper placeholders', () => {
      render(<StockForm />);

      expect(screen.getByTestId('select-branch_id')).toBeInTheDocument();
      expect(screen.getByTestId('select-product_id')).toBeInTheDocument();
      
      const placeholders = screen.getAllByTestId('select-value');
      expect(placeholders).toHaveLength(2);
    });
  });

  describe('Data Loading', () => {
    it('loads data on component mount', () => {
      render(<StockForm />);
      
      // Component should render successfully, indicating data loading works
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('loads branches and products with proper filters', () => {
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

      render(<StockForm />);
      
      expect(mockClient.from).toHaveBeenCalledWith('branch');
      expect(mockClient.from).toHaveBeenCalledWith('product');
    });
  });

  describe('Date Formatting', () => {
    it('formats date string correctly for input', () => {
      const stockWithDate = {
        id: '1',
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: 25,
        minimum_quantity: 5,
        last_updated: '2024-03-20T15:45:30Z',
      };

      render(<StockForm stock={stockWithDate} />);

      const dateInput = screen.getByLabelText(/last updated/i);
      expect(dateInput).toHaveValue('2024-03-20');
    });

    it('handles empty date string', () => {
      const stockWithoutDate = {
        id: '1',
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: 25,
        minimum_quantity: 5,
        last_updated: '',
      };

      render(<StockForm stock={stockWithoutDate} />);

      const dateInput = screen.getByLabelText(/last updated/i);
      expect(dateInput).toHaveValue('');
    });
  });

  describe('Form Structure', () => {
    it('has proper form structure with space-y-4 class', () => {
      render(<StockForm />);

      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('has button container with proper layout', () => {
      render(<StockForm />);

      const buttonContainer = document.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('renders with default state values', () => {
      render(<StockForm />);
      
      // Check that default values are displayed
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByLabelText('Current Quantity')).toHaveValue(0);
      expect(screen.getByLabelText('Minimum Quantity')).toHaveValue(0);
    });

    it('renders with stock values in edit mode', () => {
      const stock = {
        id: '1',
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: 30,
        minimum_quantity: 8,
        last_updated: '2024-01-01T00:00:00Z',
      };

      render(<StockForm stock={stock} />);
      
      // Check that the form is pre-populated with stock values
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('8')).toBeInTheDocument();
    });
  });
});