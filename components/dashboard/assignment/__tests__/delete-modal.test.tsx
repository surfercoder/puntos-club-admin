import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DeleteModal from '../delete-modal';
import { deleteAssignment } from '@/actions/dashboard/assignment/actions';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/actions/dashboard/assignment/actions', () => ({
  deleteAssignment: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteAssignment = deleteAssignment as jest.MockedFunction<typeof deleteAssignment>;

describe('DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(<DeleteModal id="1" />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('bg-red-600');
  });

  it('should open modal when delete button is clicked', () => {
    render(<DeleteModal id="1" />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Assignment?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this assignment\? This action cannot be undone\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<DeleteModal id="1" />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('Delete Assignment?')).not.toBeInTheDocument();
  });

  it('should successfully delete assignment', async () => {
    mockDeleteAssignment.mockResolvedValue(undefined);

    render(<DeleteModal id="1" />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteAssignment).toHaveBeenCalledWith('1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteAssignment.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
    );

    render(<DeleteModal id="1" />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
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
      expect(mockDeleteAssignment).toHaveBeenCalledWith('1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle string id correctly', () => {
    const testId = 'assignment-123';
    render(<DeleteModal id={testId} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    expect(mockDeleteAssignment).toHaveBeenCalledWith(testId);
  });

  it('should close modal after successful deletion', async () => {
    mockDeleteAssignment.mockResolvedValue(undefined);

    render(<DeleteModal id="1" />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm modal is open
    expect(screen.getByText('Delete Assignment?')).toBeInTheDocument();

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for deletion to complete and modal to close
    await waitFor(() => {
      expect(screen.queryByText('Delete Assignment?')).not.toBeInTheDocument();
    });
  });
});