import { render } from '@testing-library/react';
import ToastHandler from '@/components/dashboard/category/toast-handler';
import { toast } from 'sonner';

describe('ToastHandler', () => {
  let replaceStateSpy: jest.SpyInstance;

  const setSearch = (search: string) => {
    window.history.replaceState(null, '', `/dashboard/category${search}`);
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
    setSearch('?success=Category+created');
    replaceStateSpy.mockClear();

    render(<ToastHandler />);

    expect(toast.success).toHaveBeenCalledWith('Category created');
  });

  it('calls window.history.replaceState after showing toast', () => {
    setSearch('?success=Category+created');
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
    setSearch('?success=Category+created');

    const { rerender } = render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);

    // Rerender should not trigger the effect again (deps are empty)
    rerender(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('shows a new toast when remounted with a different success param', () => {
    setSearch('?success=Category+created');
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
    // This triggers the `if (!success)` branch
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe('');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
