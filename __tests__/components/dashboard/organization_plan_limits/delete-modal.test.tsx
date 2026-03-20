import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteModal from '@/components/dashboard/organization_plan_limits/delete-modal';
import { deleteOrganizationPlanLimit } from '@/actions/dashboard/organization_plan_limits/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('@/actions/dashboard/organization_plan_limits/actions', () => ({
  deleteOrganizationPlanLimit: jest.fn(),
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

const mockDeleteOrganizationPlanLimit = deleteOrganizationPlanLimit as jest.MockedFunction<typeof deleteOrganizationPlanLimit>;

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
    render(<DeleteModal limitId="limit-1" limitLabel="Test Limit" />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('title');
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteModal limitId="limit-1" limitLabel="Test Limit" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    expect(cancelButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('calls deleteOrganizationPlanLimit and shows success toast', async () => {
    mockDeleteOrganizationPlanLimit.mockResolvedValue({ error: null } as any);

    render(<DeleteModal limitId="limit-1" limitLabel="Test Limit" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeleteOrganizationPlanLimit).toHaveBeenCalledWith('limit-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('deleteSuccess');
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deleteOrganizationPlanLimit returns error', async () => {
    mockDeleteOrganizationPlanLimit.mockResolvedValue({ error: 'Something went wrong' } as any);

    render(<DeleteModal limitId="limit-1" limitLabel="Test Limit" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeleteOrganizationPlanLimit).toHaveBeenCalledWith('limit-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('deleteError');
    });
  });

  it('shows generic error toast when deleteOrganizationPlanLimit throws', async () => {
    mockDeleteOrganizationPlanLimit.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal limitId="limit-1" limitLabel="Test Limit" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('genericError');
    });
  });
});
