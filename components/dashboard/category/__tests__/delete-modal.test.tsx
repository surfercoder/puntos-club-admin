import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { toast } from 'sonner';

// Mock all dependencies
const mockRouter = { 
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/actions/dashboard/category/actions', () => ({
  deleteCategory: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: Record<string, unknown> & { children?: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string; size?: string; className?: string }) =>
    React.createElement('button', { onClick, disabled, 'data-variant': variant, 'data-size': size, className }, children),
}));

jest.mock('lucide-react', () => ({
  Trash2: ({ className }: { className?: string }) =>
    React.createElement('svg', { 'data-testid': 'trash-icon', className }, 'Trash2'),
}));import { deleteCategory } from '@/actions/dashboard/category/actions';

import DeleteModal from '../delete-modal';

describe('Category DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (deleteCategory as jest.Mock).mockResolvedValue({ error: null });
  });

  describe('Initial State', () => {
    it('renders delete button when modal is closed', () => {
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toHaveAttribute('data-variant', 'destructive');
      expect(deleteButton).toHaveAttribute('data-size', 'sm');
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('does not render modal content initially', () => {
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Are you sure you want to delete')).not.toBeInTheDocument();
    });
  });

  describe('Opening Modal', () => {
    it('opens modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Delete Category')).toBeInTheDocument();
    });
  });

  describe('Modal Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
    });

    it('renders modal content when open', () => {
      expect(screen.getByText('Delete Category')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('renders cancel and delete buttons in modal', () => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('has proper modal styling', () => {
      const modalBackdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      const modalContent = document.querySelector('.bg-white.p-6.rounded-lg.shadow-lg');
      
      expect(modalBackdrop).toBeInTheDocument();
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Modal should be closed
      expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
    });

    it('calls deleteCategory when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const deleteButtonInModal = screen.getByText('Delete');
      await user.click(deleteButtonInModal);

      expect(deleteCategory).toHaveBeenCalledWith('1');
    });
  });

  describe('Delete Success', () => {
    it('shows success toast and refreshes router on successful delete', async () => {
      (deleteCategory as jest.Mock).mockResolvedValue({ error: null });
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const deleteButtonInModal = screen.getByText('Delete');
      await user.click(deleteButtonInModal);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Category deleted successfully');
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Error', () => {
    it('shows error toast when delete returns error', async () => {
      (deleteCategory as jest.Mock).mockResolvedValue({ error: 'Delete failed' });
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const deleteButtonInModal = screen.getByText('Delete');
      await user.click(deleteButtonInModal);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete category');
      });
    });

    it('shows error toast when delete throws exception', async () => {
      (deleteCategory as jest.Mock).mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const deleteButtonInModal = screen.getByText('Delete');
      await user.click(deleteButtonInModal);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred while deleting');
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading text and disables buttons when deleting', async () => {
      // Mock deleteCategory to not resolve immediately
      let resolveDelete: () => void;
      const deletePromise = new Promise<{ error: null }>((resolve) => {
        resolveDelete = () => resolve({ error: null });
      });
      (deleteCategory as jest.Mock).mockReturnValue(deletePromise);

      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const deleteButtonInModal = screen.getByText('Delete');
      await user.click(deleteButtonInModal);

      // Check loading state
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Deleting...')).toBeDisabled();

      // Resolve the promise to clean up
      resolveDelete!();
      await waitFor(() => {
        expect(screen.queryByText('Delete Category')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props', () => {
    it('uses categoryId for delete operation', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="test-category-123" categoryName="Electronics" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const deleteButtonInModal = screen.getByText('Delete');
      await user.click(deleteButtonInModal);

      expect(deleteCategory).toHaveBeenCalledWith('test-category-123');
    });

    it('displays categoryName in confirmation message', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal categoryId="1" categoryName="Special Category" />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Special Category')).toBeInTheDocument();
    });
  });
});