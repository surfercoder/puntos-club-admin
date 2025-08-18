import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import DeleteModal from '../delete-modal';
import { deleteBeneficiary } from '@/actions/dashboard/beneficiary/actions';

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

jest.mock('@/actions/dashboard/beneficiary/actions', () => ({
  deleteBeneficiary: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockDeleteBeneficiary = deleteBeneficiary as jest.MockedFunction<typeof deleteBeneficiary>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('DeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('should render delete button when modal is closed', () => {
    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
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
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
    );

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete Beneficiary')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('Test Beneficiary')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed (back to delete button)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    expect(screen.queryByText('Delete Beneficiary')).not.toBeInTheDocument();
  });

  it('should successfully delete beneficiary', async () => {
    mockDeleteBeneficiary.mockResolvedValue({ error: null });

    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteBeneficiary).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Beneficiary deleted successfully');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should handle delete error', async () => {
    mockDeleteBeneficiary.mockResolvedValue({ error: { message: 'Delete failed' } });

    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteBeneficiary).toHaveBeenCalledWith('1');
      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete beneficiary');
    });
  });

  it('should handle delete exception', async () => {
    mockDeleteBeneficiary.mockRejectedValue(new Error('Network error'));

    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    // Click delete
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for the async operation
    await waitFor(() => {
      expect(mockDeleteBeneficiary).toHaveBeenCalledWith('1');
      expect(mockToast.error).toHaveBeenCalledWith('An error occurred while deleting');
    });
  });

  it('should show loading state during delete', async () => {
    // Mock a delayed response
    mockDeleteBeneficiary.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="Test Beneficiary" />
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

  it('should display beneficiary name in confirmation message', () => {
    render(
      <DeleteModal beneficiaryId="1" beneficiaryName="My Special Beneficiary" />
    );

    // Open modal
    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(screen.getByText('My Special Beneficiary')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
  });
});