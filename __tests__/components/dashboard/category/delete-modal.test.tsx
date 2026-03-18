import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteModal from '@/components/dashboard/category/delete-modal';
import { deleteCategory } from '@/actions/dashboard/category/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('@/actions/dashboard/category/actions', () => ({
  deleteCategory: jest.fn(),
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

const mockDeleteCategory = deleteCategory as jest.MockedFunction<typeof deleteCategory>;

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
    render(<DeleteModal categoryId="cat-1" categoryName="Test Category" />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('title');
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteModal categoryId="cat-1" categoryName="Test Category" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    expect(cancelButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('calls deleteCategory and shows success toast', async () => {
    mockDeleteCategory.mockResolvedValue({ error: null } as any);

    render(<DeleteModal categoryId="cat-1" categoryName="Test Category" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('cat-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('deleteSuccess');
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deleteCategory returns error', async () => {
    mockDeleteCategory.mockResolvedValue({ error: 'Something went wrong' } as any);

    render(<DeleteModal categoryId="cat-1" categoryName="Test Category" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('cat-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('deleteError');
    });
  });

  it('shows generic error toast when deleteCategory throws', async () => {
    mockDeleteCategory.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal categoryId="cat-1" categoryName="Test Category" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('genericError');
    });
  });
});
