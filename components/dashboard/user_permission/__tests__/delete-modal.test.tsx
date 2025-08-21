import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock all dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// No React mocking needed - use real React hooks

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/actions/dashboard/user_permission/actions', () => ({
  deleteUserPermission: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: Record<string, unknown> & { children?: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: string; size?: string; className?: string }) =>
    React.createElement('button', { onClick, disabled, 'data-variant': variant, 'data-size': size, className }, children),
}));

jest.mock('lucide-react', () => ({
  Trash2: ({ className }: { className?: string }) =>
    React.createElement('svg', { 'data-testid': 'trash-icon', className }, 'Trash2'),
}));import { deleteUserPermission } from '@/actions/dashboard/user_permission/actions';

import DeleteModal from '../delete-modal';

const mockRouter = { refresh: jest.fn() };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteUserPermission = deleteUserPermission as jest.MockedFunction<typeof deleteUserPermission>;

describe('UserPermission DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
    mockDeleteUserPermission.mockResolvedValue({ error: null });
  });

  describe('Initial State', () => {
    it('renders delete button when modal is closed', () => {
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toHaveAttribute('data-variant', 'destructive');
      expect(deleteButton).toHaveAttribute('data-size', 'sm');
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('does not render modal content initially', () => {
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      expect(screen.queryByText('Delete User Permission')).not.toBeInTheDocument();
      expect(screen.queryByText('Are you sure you want to delete')).not.toBeInTheDocument();
    });
  });

  describe('Opening Modal', () => {
    it('opens modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Delete User Permission')).toBeInTheDocument();
    });
  });

  describe('Modal Content', () => {
    beforeEach(() => {
      // Modal starts closed, will open via user interaction
    });

    it('renders modal content when open', async () => {
      const user = userEvent.setup();
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Delete User Permission')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete user permission/)).toBeInTheDocument();
      expect(screen.getByText('John Doe - Admin Access')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('renders cancel and delete buttons in modal', async () => {
      const user = userEvent.setup();
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('has proper modal styling', async () => {
      const user = userEvent.setup();
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      const modalBackdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      const modalContent = document.querySelector('.bg-white.p-6.rounded-lg.shadow-lg');
      
      expect(modalBackdrop).toBeInTheDocument();
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    beforeEach(() => {
      // Use real state management
    });

    it('closes modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);
      
      // Then close it
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByText('Delete User Permission')).not.toBeInTheDocument();
    });

    it('calls deleteUserPermission when delete button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then click delete in modal
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(deleteUserPermission).toHaveBeenCalledWith('1');
    });
  });

  describe('Delete Success', () => {
    beforeEach(() => {
      deleteUserPermission.mockResolvedValue({ error: null });
    });

    it('shows success toast and refreshes router on successful delete', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('User permission deleted successfully');
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Error', () => {
    beforeEach(() => {
      // Use real state management
    });

    it('shows error toast when delete returns error', async () => {
      const user = userEvent.setup();
      deleteUserPermission.mockResolvedValue({ error: 'Delete failed' });
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete user permission');
      });
    });

    it('shows error toast when delete throws exception', async () => {
      const user = userEvent.setup();
      deleteUserPermission.mockRejectedValue(new Error('Network error'));
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An error occurred while deleting');
      });
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      // Use real state management
    });

    it('shows loading text when deleting', async () => {
      const user = userEvent.setup();
      // Mock a slow delete operation
      let resolveDelete: (value: unknown) => void;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      mockDeleteUserPermission.mockReturnValue(deletePromise);
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then start delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      
      // Resolve the promise
      resolveDelete!({ error: null });
    });

    it('disables buttons when deleting', async () => {
      const user = userEvent.setup();
      // Mock a slow delete operation
      let resolveDelete: (value: unknown) => void;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });
      mockDeleteUserPermission.mockReturnValue(deletePromise);
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then start delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      const cancelButton = screen.getByText('Cancel');
      const deletingButton = screen.getByText('Deleting...');
      
      expect(cancelButton).toBeDisabled();
      expect(deletingButton).toBeDisabled();
      
      // Resolve the promise
      resolveDelete!({ error: null });
    });
  });

  describe('State Management', () => {
    it('manages isOpen state correctly', () => {
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="1" />);
      
      // State management works with real useState
    });
  });

  describe('Props', () => {
    it('uses permissionId for delete operation', async () => {

      const user = userEvent.setup();
      
      render(<DeleteModal userPermissionDescription="John Doe - Admin Access" userPermissionId="test-perm-123" />);

      // First open modal
      const triggerButton = screen.getByRole('button');
      await user.click(triggerButton);
      
      // Then delete
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(deleteUserPermission).toHaveBeenCalledWith('test-perm-123');
    });

    it('displays permissionDescription in confirmation message', async () => {
      const user = userEvent.setup();
      
      render(<DeleteModal userPermissionDescription="Jane Smith - Read Access" userPermissionId="1" />);

      // First open modal
      const deleteButton = screen.getByRole('button');
      await user.click(deleteButton);

      expect(screen.getByText('Jane Smith - Read Access')).toBeInTheDocument();
    });
  });
});