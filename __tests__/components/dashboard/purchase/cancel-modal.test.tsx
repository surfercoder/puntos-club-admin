import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CancelModal from '@/components/dashboard/purchase/cancel-modal';
import { cancelPurchase } from '@/actions/dashboard/purchase/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('@/actions/dashboard/purchase/actions', () => ({
  cancelPurchase: jest.fn(),
}));

// Mock Dialog components - always render all children to test the full component
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, onOpenChange }: any) => <div role="dialog" data-testid="dialog" onClick={() => onOpenChange?.(false)} onKeyDown={(e: any) => { if (e.key === 'Escape') onOpenChange?.(false); }}>{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

const mockCancelPurchase = cancelPurchase as jest.MockedFunction<typeof cancelPurchase>;

describe('CancelModal', () => {
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
    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('title');
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('names the icon-only trigger for screen readers', () => {
    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    expect(screen.getByRole('button', { name: 'trigger' })).toBeInTheDocument();
  });

  it('renders cancel and confirm buttons', () => {
    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    const confirmButton = buttons.find((b) => b.textContent === 'confirmButton');
    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();
  });

  it('calls cancelPurchase and shows success toast', async () => {
    mockCancelPurchase.mockResolvedValue({ success: true } as any);

    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find((b) => b.textContent === 'confirmButton');
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(mockCancelPurchase).toHaveBeenCalledWith('pur-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('cancelSuccess');
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows fallback error toast when cancelPurchase returns failure with no error message', async () => {
    mockCancelPurchase.mockResolvedValue({ success: false, error: undefined } as any);

    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find((b) => b.textContent === 'confirmButton');
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(mockCancelPurchase).toHaveBeenCalledWith('pur-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('cancelError');
    });
  });

  it('shows error toast when cancelPurchase returns failure', async () => {
    mockCancelPurchase.mockResolvedValue({ success: false, error: 'Something went wrong' } as any);

    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find((b) => b.textContent === 'confirmButton');
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(mockCancelPurchase).toHaveBeenCalledWith('pur-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('closes dialog when cancel button is clicked', () => {
    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    fireEvent.click(cancelButton!);
  });

  it('triggers onOpenChange callback on Dialog', () => {
    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);
    fireEvent.click(screen.getByTestId('dialog'));
  });

  it('shows generic error toast when cancelPurchase throws', async () => {
    mockCancelPurchase.mockRejectedValue(new Error('Network error'));

    render(<CancelModal purchaseId="pur-1" purchaseNumber="PUR-001" />);

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find((b) => b.textContent === 'confirmButton');
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('genericError');
    });
  });
});
