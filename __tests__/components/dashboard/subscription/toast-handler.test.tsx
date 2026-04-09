import { render } from '@testing-library/react';
import ToastHandler from '@/components/dashboard/subscription/toast-handler';
import { toast } from 'sonner';

describe('ToastHandler', () => {
  const setSearch = (search: string) => {
    window.history.replaceState(null, '', `/dashboard${search}`);
  };

  beforeEach(() => {
    (toast.success as jest.Mock).mockClear();
    setSearch('');
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe('');
  });

  it('shows toast.success when success param is present', () => {
    setSearch('?success=Category+created');
    render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledWith('Category created');
  });

  it('cleans the success param from the URL after showing toast', () => {
    setSearch('?success=Category+created');
    render(<ToastHandler />);
    expect(window.location.search).not.toContain('success');
  });

  it('does not show toast when success param is absent', () => {
    setSearch('');
    render(<ToastHandler />);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not show the same toast message twice on re-render', () => {
    setSearch('?success=Category+created');
    const { rerender } = render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);
    setSearch('?success=Category+created');
    rerender(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });
});
