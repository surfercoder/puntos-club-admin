import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import DeleteModal from '../delete-modal';
import { deleteBranch } from '@/actions/dashboard/branch/actions';

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

jest.mock('@/actions/dashboard/branch/actions', () => ({
  deleteBranch: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteBranch = deleteBranch as jest.MockedFunction<typeof deleteBranch>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(
      <DeleteModal branchId="1" branchName="Test Branch" />
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
      <DeleteModal branchId="1" branchName="Test Branch" />
    );

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Branch')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('Test Branch')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(
      <DeleteModal branchId="1" branchName="Test Branch" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed (back to delete button)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    expect(screen.queryByText('Delete Branch')).not.toBeInTheDocument();
  });

  it('should successfully delete branch', async () => {
    mockDeleteBranch.mockResolvedValue({ error: null });

    render(
      <DeleteModal branchId="1" branchName="Test Branch" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteBranch).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Branch deleted successfully');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle delete error', async () => {
    mockDeleteBranch.mockResolvedValue({ error: { message: 'Delete failed' } });

    render(
      <DeleteModal branchId="1" branchName="Test Branch" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteBranch).toHaveBeenCalledWith('1');
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete branch');
    });
  });

  it('should handle delete exception', async () => {
    mockDeleteBranch.mockRejectedValue(new Error('Network error'));

    render(
      <DeleteModal branchId="1" branchName="Test Branch" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteBranch).toHaveBeenCalledWith('1');
      expect(mockToast.error).toHaveBeenCalledWith('An error occurred while deleting');
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteBranch.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(
      <DeleteModal branchId="1" branchName="Test Branch" />
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

  it('should display branch name in confirmation message', () => {
    render(
      <DeleteModal branchId="1" branchName="My Special Branch" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('My Special Branch')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });
});