import { render } from '@testing-library/react';
import ToastHandler from '@/components/dashboard/subscription/toast-handler';
import { toast } from 'sonner';

describe('ToastHandler', () => {
  let replaceStateSpy: jest.SpyInstance;

  const setSearch = (search: string) => {
    window.history.replaceState(null, '', `/dashboard/subscription${search}`);
  };

  beforeEach(() => {
    setSearch('');
    replaceStateSpy = jest.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
  });

  it('renders nothing (returns null)', () => {
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe('');
  });

  it('shows toast.success when success param is present', () => {
    setSearch('?success=Subscription+created');
    replaceStateSpy.mockClear();

    render(<ToastHandler />);

    expect(toast.success).toHaveBeenCalledWith('Subscription created');
  });

  it('calls window.history.replaceState after showing toast', () => {
    setSearch('?success=Subscription+created');
    replaceStateSpy.mockClear();

    render(<ToastHandler />);

    expect(replaceStateSpy).toHaveBeenCalled();
    const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
    expect(lastCall[2]).not.toContain('success=');
  });

  it('does not show toast when success param is absent', () => {
    setSearch('');
    replaceStateSpy.mockClear();

    render(<ToastHandler />);

    expect(toast.success).not.toHaveBeenCalled();
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it('does not show the same toast message twice on rerender', () => {
    setSearch('?success=Subscription+created');

    const { rerender } = render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);

    rerender(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('shows a new toast when remounted with a different success param', () => {
    setSearch('?success=Subscription+created');
    const { unmount } = render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);
    unmount();

    setSearch('?success=Another+message');
    render(<ToastHandler />);

    expect(toast.success).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith('Another message');
  });

  it('resets ref when success param is absent (no success branch)', () => {
    setSearch('');
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe('');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
