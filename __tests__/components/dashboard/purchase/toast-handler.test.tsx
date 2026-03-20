import { render } from '@testing-library/react';
import ToastHandler from '@/components/dashboard/purchase/toast-handler';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

describe('ToastHandler', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: mockReplace,
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
  });

  it('renders nothing (returns null)', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    const { container } = render(<ToastHandler />);
    expect(container.innerHTML).toBe('');
  });

  it('shows toast.success when success param is present', () => {
    const params = new URLSearchParams('success=Purchase+created');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    render(<ToastHandler />);

    expect(toast.success).toHaveBeenCalledWith('Purchase created');
  });

  it('calls router.replace after showing toast', () => {
    const params = new URLSearchParams('success=Purchase+created');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    render(<ToastHandler />);

    expect(mockReplace).toHaveBeenCalled();
  });

  it('does not show toast when success param is absent', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

    render(<ToastHandler />);

    expect(toast.success).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not show the same toast message twice', () => {
    const params = new URLSearchParams('success=Purchase+created');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { rerender } = render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);

    rerender(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('resets ref and allows new toast when success param is removed then re-added', () => {
    const params = new URLSearchParams('success=Purchase+created');
    (useSearchParams as jest.Mock).mockReturnValue(params);

    const { rerender } = render(<ToastHandler />);
    expect(toast.success).toHaveBeenCalledTimes(1);

    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    rerender(<ToastHandler />);

    const newParams = new URLSearchParams('success=Another+message');
    (useSearchParams as jest.Mock).mockReturnValue(newParams);
    rerender(<ToastHandler />);

    expect(toast.success).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith('Another message');
  });
});
