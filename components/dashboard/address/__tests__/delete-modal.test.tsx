import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { deleteAddress } from '@/actions/dashboard/address/actions';

import DeleteModal from '../delete-modal';


// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/actions/dashboard/address/actions', () => ({
  deleteAddress: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteAddress = deleteAddress as jest.MockedFunction<typeof deleteAddress>;

describe('DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(<DeleteModal id={1} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass('bg-red-600');
  });

  it('should open modal when delete button is clicked', () => {
    render(<DeleteModal id={1} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Address?')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this address\? This action cannot be undone\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<DeleteModal id={1} />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('Delete Address?')).not.toBeInTheDocument();
  });

  it('should successfully delete address', async () => {
    mockDeleteAddress.mockResolvedValue(undefined);

    render(<DeleteModal id={1} />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteAddress).toHaveBeenCalledWith(1);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteAddress.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
    );

    render(<DeleteModal id={1} />);

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
      expect(mockDeleteAddress).toHaveBeenCalledWith(1);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle numeric id correctly', () => {
    const testId = 123;
    render(<DeleteModal id={testId} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    expect(mockDeleteAddress).toHaveBeenCalledWith(testId);
  });

  it('should close modal after successful deletion', async () => {
    mockDeleteAddress.mockResolvedValue(undefined);

    render(<DeleteModal id={1} />);

    // Open modal
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Confirm modal is open
    expect(screen.getByText('Delete Address?')).toBeInTheDocument();

    // Click delete
    const confirmDeleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmDeleteButton);

    // Wait for deletion to complete and modal to close
    await waitFor(() => {
      expect(screen.queryByText('Delete Address?')).not.toBeInTheDocument();
    });
  });
});