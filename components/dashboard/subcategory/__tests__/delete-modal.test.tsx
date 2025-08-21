import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { deleteSubcategory } from '@/actions/dashboard/subcategory/actions';

import DeleteModal from '../delete-modal';


// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/actions/dashboard/subcategory/actions', () => ({
  deleteSubcategory: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Trash2: ({ className, ...props }: Record<string, unknown> & { className?: string }) => 
    React.createElement('svg', { className, 'data-testid': 'trash-icon', ...props }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, disabled, onClick, variant, size, ...props }: Record<string, unknown> & { 
    children?: React.ReactNode; 
    className?: string; 
    disabled?: boolean; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
  }) => React.createElement('button', { 
    className: `${className} ${variant === 'destructive' ? 'bg-red-600' : ''}`, 
    disabled, 
    onClick, 
    size,
    ...props 
  }, children),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteSubcategory = deleteSubcategory as jest.MockedFunction<typeof deleteSubcategory>;

describe('DeleteModal (Subcategory)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('bg-red-600');
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('should open modal when delete button is clicked', () => {
    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Subcategory')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('Delete Subcategory')).not.toBeInTheDocument();
  });

  it('should successfully delete subcategory', async () => {
    mockDeleteSubcategory.mockResolvedValue({ error: null });

    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteSubcategory).toHaveBeenCalledWith('1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle delete error with error result', async () => {
    mockDeleteSubcategory.mockResolvedValue({ error: 'Failed to delete' });

    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteSubcategory).toHaveBeenCalledWith('1');
    });
  });

  it('should handle delete exception', async () => {
    mockDeleteSubcategory.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteSubcategory).toHaveBeenCalledWith('1');
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteSubcategory.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Check loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(mockDeleteSubcategory).toHaveBeenCalledWith('1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle string id correctly', () => {
    const testId = "subcategory-123";
    render(<DeleteModal subcategoryId={testId} subcategoryName="Jane Smith" />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    expect(mockDeleteSubcategory).toHaveBeenCalledWith(testId);
  });

  it('should close modal after successful deletion', async () => {
    mockDeleteSubcategory.mockResolvedValue({ error: null });

    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Confirm modal is open
    expect(screen.getByText('Delete Subcategory')).toBeInTheDocument();

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for deletion to complete and modal to close
    await waitFor(() => {
      expect(screen.queryByText('Delete Subcategory')).not.toBeInTheDocument();
    });
  });

  it('should display subcategory name in confirmation message', () => {
    const testSubcategoryName = "Test Subcategory Name";
    render(<DeleteModal subcategoryId="1" subcategoryName={testSubcategoryName} />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText(testSubcategoryName)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });

  it('should close modal after deletion failure', async () => {
    mockDeleteSubcategory.mockResolvedValue({ error: 'Failed to delete' });

    render(<DeleteModal subcategoryId="1" subcategoryName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Confirm modal is open
    expect(screen.getByText('Delete Subcategory')).toBeInTheDocument();

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for deletion attempt and modal to close
    await waitFor(() => {
      expect(screen.queryByText('Delete Subcategory')).not.toBeInTheDocument();
    });
  });
});