import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteModal from '@/components/dashboard/plan_limits/delete-modal';
import { deletePlanLimit } from '@/actions/dashboard/plan_limits/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('@/actions/dashboard/plan_limits/actions', () => ({
  deletePlanLimit: jest.fn(),
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

const mockDeletePlanLimit = deletePlanLimit as jest.MockedFunction<typeof deletePlanLimit>;

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
    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('title');
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    expect(cancelButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('calls deletePlanLimit and shows success toast', async () => {
    mockDeletePlanLimit.mockResolvedValue({ error: null } as any);

    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeletePlanLimit).toHaveBeenCalledWith('pl-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('deleteSuccess');
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deletePlanLimit returns error', async () => {
    mockDeletePlanLimit.mockResolvedValue({ error: 'Something went wrong' } as any);

    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeletePlanLimit).toHaveBeenCalledWith('pl-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('deleteError');
    });
  });

  it('closes dialog when cancel button is clicked', () => {
    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    fireEvent.click(cancelButton!);
  });

  it('triggers onOpenChange callback on Dialog', () => {
    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);
    fireEvent.click(screen.getByTestId('dialog'));
  });

  it('shows generic error toast when deletePlanLimit throws', async () => {
    mockDeletePlanLimit.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal planLimitId="pl-1" planLimitLabel="Test Plan Limit" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('genericError');
    });
  });
});
