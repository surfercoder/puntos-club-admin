import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/actions/dashboard/app_order/actions', () => ({
  deleteAppOrder: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled, ...props }: Record<string, unknown> & { 
    children?: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
    disabled?: boolean;
  }) => React.createElement('button', { onClick, disabled, 'data-variant': variant, 'data-size': size, ...props }, children)
}));

jest.mock('lucide-react', () => ({
  Trash2: ({ className }: { className?: string }) => React.createElement('span', { className, 'data-testid': 'trash-icon' }, 'Trash'),
}));

import DeleteModal from '../delete-modal';
import { deleteAppOrder } from '@/actions/dashboard/app_order/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const mockDeleteAppOrder = deleteAppOrder as jest.MockedFunction<typeof deleteAppOrder>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('DeleteModal', () => {
  const defaultProps = {
    appOrderId: 'order-123',
    appOrderNumber: 'ORDER-001',
  };

  const mockRouter = {
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  describe('Initial State', () => {
    it('renders delete button when modal is closed', () => {
      render(<DeleteModal {...defaultProps} />);

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute('data-variant', 'destructive');
      expect(deleteButton).toHaveAttribute('data-size', 'sm');
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('does not render modal content initially', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.queryByText('Delete Order')).not.toBeInTheDocument();
      expect(screen.queryByText(/are you sure you want to delete order/i)).not.toBeInTheDocument();
    });
  });

  describe('Modal Opening', () => {
    it('opens modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteModal {...defaultProps} />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Delete Order')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete order/i)).toBeInTheDocument();
      expect(screen.getByText('ORDER-001')).toBeInTheDocument();
    });

    it('shows modal with correct order number', async () => {
      const user = userEvent.setup();
      render(<DeleteModal {...defaultProps} appOrderNumber="ORDER-999" />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('ORDER-999')).toBeInTheDocument();
    });
  });

  describe('Modal Content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<DeleteModal {...defaultProps} />);
      
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
    });

    it('renders modal with correct structure', () => {
      expect(screen.getByText('Delete Order')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete order/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deleteButton = screen.getByRole('button', { name: /^delete$/i });
      
      expect(cancelButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('has proper styling classes', () => {
      const modalOverlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      const modalContent = document.querySelector('.bg-white.p-6.rounded-lg.shadow-lg');
      
      expect(modalOverlay).toBeInTheDocument();
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Modal Closing', () => {
    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteModal {...defaultProps} />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Delete Order')).not.toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('calls deleteAppOrder when delete button is clicked', async () => {
      const user = userEvent.setup();
      mockDeleteAppOrder.mockResolvedValue({ success: true });
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      // Click delete
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      expect(mockDeleteAppOrder).toHaveBeenCalledWith('order-123');
    });

    it('shows success toast and refreshes on successful delete', async () => {
      const user = userEvent.setup();
      mockDeleteAppOrder.mockResolvedValue({ success: true });
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Order deleted successfully');
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('shows error toast on delete failure', async () => {
      const user = userEvent.setup();
      mockDeleteAppOrder.mockResolvedValue({ error: 'Delete failed' });
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete order');
      });
    });

    it('shows error toast on exception', async () => {
      const user = userEvent.setup();
      mockDeleteAppOrder.mockRejectedValue(new Error('Network error'));
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred while deleting');
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during delete operation', async () => {
      const user = userEvent.setup();
      let resolveDelete: (value: unknown) => void;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      mockDeleteAppOrder.mockReturnValue(deletePromise);
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and start delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      // Check loading state
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();

      // Resolve the promise
      resolveDelete!({ success: true });
      
      await waitFor(() => {
        expect(screen.queryByText('Delete Order')).not.toBeInTheDocument();
      });
    });

    it('disables buttons during loading', async () => {
      const user = userEvent.setup();
      let resolveDelete: (value: unknown) => void;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      mockDeleteAppOrder.mockReturnValue(deletePromise);
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and start delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      // Check that buttons are disabled
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const deletingButton = screen.getByRole('button', { name: /deleting/i });
      
      expect(cancelButton).toBeDisabled();
      expect(deletingButton).toBeDisabled();

      // Resolve and clean up
      resolveDelete!({ success: true });
    });
  });

  describe('Modal Cleanup', () => {
    it('closes modal after successful delete', async () => {
      const user = userEvent.setup();
      mockDeleteAppOrder.mockResolvedValue({ success: true });
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Order')).not.toBeInTheDocument();
      });
    });

    it('closes modal after failed delete', async () => {
      const user = userEvent.setup();
      mockDeleteAppOrder.mockResolvedValue({ error: 'Delete failed' });
      
      render(<DeleteModal {...defaultProps} />);

      // Open modal and delete
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Order')).not.toBeInTheDocument();
      });
    });
  });
});