import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { deleteAppUser } from '@/actions/dashboard/app_user/actions';

import DeleteModal from '../delete-modal';


// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/actions/dashboard/app_user/actions', () => ({
  deleteAppUser: jest.fn(),
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
const mockDeleteAppUser = deleteAppUser as jest.MockedFunction<typeof deleteAppUser>;

describe('DeleteModal (App User)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('bg-red-600');
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('should open modal when delete button is clicked', () => {
    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete user/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
  });

  it('should successfully delete app user', async () => {
    mockDeleteAppUser.mockResolvedValue({ error: null });

    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteAppUser).toHaveBeenCalledWith('1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle delete error with error result', async () => {
    mockDeleteAppUser.mockResolvedValue({ error: 'Failed to delete' });

    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteAppUser).toHaveBeenCalledWith('1');
    });
  });

  it('should handle delete exception', async () => {
    mockDeleteAppUser.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteAppUser).toHaveBeenCalledWith('1');
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteAppUser.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

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
      expect(mockDeleteAppUser).toHaveBeenCalledWith('1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle string id correctly', () => {
    const testId = "user-123";
    render(<DeleteModal appUserId={testId} appUserName="Jane Smith" />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    expect(mockDeleteAppUser).toHaveBeenCalledWith(testId);
  });

  it('should close modal after successful deletion', async () => {
    mockDeleteAppUser.mockResolvedValue({ error: null });

    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Confirm modal is open
    expect(screen.getByText('Delete User')).toBeInTheDocument();

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for deletion to complete and modal to close
    await waitFor(() => {
      expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
    });
  });

  it('should display user name in confirmation message', () => {
    const testUserName = "Test User Name";
    render(<DeleteModal appUserId="1" appUserName={testUserName} />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText(testUserName)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete user/)).toBeInTheDocument();
  });

  it('should close modal after deletion failure', async () => {
    mockDeleteAppUser.mockResolvedValue({ error: 'Failed to delete' });

    render(<DeleteModal appUserId="1" appUserName="John Doe" />);

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Confirm modal is open
    expect(screen.getByText('Delete User')).toBeInTheDocument();

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for deletion attempt and modal to close
    await waitFor(() => {
      expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
    });
  });
});