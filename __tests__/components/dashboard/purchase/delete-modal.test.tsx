import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteModal from '@/components/dashboard/purchase/delete-modal';
import { deletePurchase } from '@/actions/dashboard/purchase/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('@/actions/dashboard/purchase/actions', () => ({
  deletePurchase: jest.fn(),
}));

// Mock Dialog components - always render all children to test the full component
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

const mockDeletePurchase = deletePurchase as jest.MockedFunction<typeof deletePurchase>;

describe('DeleteModal', () => {
  const mockRefresh = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: mockRefresh,
    });
  });

  it('renders the trigger button and dialog content', () => {
    render(<DeleteModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('title');
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    expect(cancelButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('calls deletePurchase and shows success toast', async () => {
    mockDeletePurchase.mockResolvedValue({ success: true } as any);

    render(<DeleteModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeletePurchase).toHaveBeenCalledWith('pur-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('deleteSuccess');
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deletePurchase returns failure', async () => {
    mockDeletePurchase.mockResolvedValue({ success: false, error: 'Something went wrong' } as any);

    render(<DeleteModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeletePurchase).toHaveBeenCalledWith('pur-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('shows generic error toast when deletePurchase throws', async () => {
    mockDeletePurchase.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('genericError');
    });
  });
});
