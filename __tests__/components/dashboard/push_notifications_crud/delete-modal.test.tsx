import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteModal from '@/components/dashboard/push_notifications_crud/delete-modal';
import { deletePushNotification } from '@/actions/dashboard/push_notifications/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

jest.mock('@/actions/dashboard/push_notifications/actions', () => ({
  deletePushNotification: jest.fn(),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const mockDeletePushNotification = deletePushNotification as jest.MockedFunction<typeof deletePushNotification>;

describe('DeleteModal (push_notifications_crud)', () => {
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
    render(<DeleteModal notificationId="pn-1" notificationTitle="Test Push" />);
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('title');
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
  });

  it('renders cancel and delete buttons', () => {
    render(<DeleteModal notificationId="pn-1" notificationTitle="Test Push" />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent === 'cancel');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    expect(cancelButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();
  });

  it('calls deletePushNotification and shows success toast', async () => {
    mockDeletePushNotification.mockResolvedValue({ error: null } as any);

    render(<DeleteModal notificationId="pn-1" notificationTitle="Test Push" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeletePushNotification).toHaveBeenCalledWith('pn-1');
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('deleteSuccess');
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deletePushNotification returns error', async () => {
    mockDeletePushNotification.mockResolvedValue({ error: 'Something went wrong' } as any);

    render(<DeleteModal notificationId="pn-1" notificationTitle="Test Push" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(mockDeletePushNotification).toHaveBeenCalledWith('pn-1');
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('deleteError');
    });
  });

  it('shows generic error toast when deletePushNotification throws', async () => {
    mockDeletePushNotification.mockRejectedValue(new Error('Network error'));

    render(<DeleteModal notificationId="pn-1" notificationTitle="Test Push" />);

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((b) => b.textContent === 'delete');
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('genericError');
    });
  });
});
