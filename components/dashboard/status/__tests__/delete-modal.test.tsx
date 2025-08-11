import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import DeleteModal from '../delete-modal';
import { deleteStatus } from '@/actions/dashboard/status/actions';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/actions/dashboard/status/actions', () => ({
  deleteStatus: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteStatus = deleteStatus as jest.MockedFunction<typeof deleteStatus>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    const deleteButton = screen.getByRole('button');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('bg-red-600');
    
    // Check for the Trash2 icon
    const trashIcon = deleteButton.querySelector('svg');
    expect(trashIcon).toBeInTheDocument();
  });

  it('should open modal when delete button is clicked', () => {
    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Status')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('Test Status')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed (back to delete button)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    expect(screen.queryByText('Delete Status')).not.toBeInTheDocument();
  });

  it('should successfully delete status', async () => {
    mockDeleteStatus.mockResolvedValue({ error: null });

    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteStatus).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Status deleted successfully');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle delete error', async () => {
    mockDeleteStatus.mockResolvedValue({ error: { message: 'Delete failed' } });

    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteStatus).toHaveBeenCalledWith('1');
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete status');
    });
  });

  it('should handle delete exception', async () => {
    mockDeleteStatus.mockRejectedValue(new Error('Network error'));

    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteStatus).toHaveBeenCalledWith('1');
      expect(mockToast.error).toHaveBeenCalledWith('An error occurred while deleting');
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteStatus.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(
      <DeleteModal statusId="1" statusName="Test Status" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Check loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Deleting...')).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it('should display status name in confirmation message', () => {
    render(
      <DeleteModal statusId="1" statusName="My Special Status" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('My Special Status')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });
});