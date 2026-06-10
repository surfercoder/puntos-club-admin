import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockDeliver = jest.fn();
const mockCancel = jest.fn();
const mockRefresh = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `t:${key}`),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ refresh: mockRefresh })),
}));

jest.mock('sonner', () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args), error: (...args: unknown[]) => mockToastError(...args) },
}));

jest.mock('@/actions/dashboard/redemption/actions', () => ({
  deliverRedemption: (...args: unknown[]) => mockDeliver(...args),
  cancelRedemption: (...args: unknown[]) => mockCancel(...args),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button disabled={disabled} onClick={onClick}>{children}</button>
  ),
}));

import { PendingRedemptionActions } from '@/components/dashboard/redemption/row-actions';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PendingRedemptionActions', () => {
  it('delivers successfully and refreshes', async () => {
    mockDeliver.mockResolvedValueOnce({ error: null });
    render(<PendingRedemptionActions redemptionId="5" />);
    fireEvent.click(screen.getByText('t:deliverButton'));
    await waitFor(() => expect(mockDeliver).toHaveBeenCalledWith('5'));
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('t:deliverSuccess'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows error toast when deliver fails', async () => {
    mockDeliver.mockResolvedValueOnce({ error: { message: 'fail' } });
    render(<PendingRedemptionActions redemptionId="5" />);
    fireEvent.click(screen.getByText('t:deliverButton'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('t:actionError'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('cancels successfully and refreshes', async () => {
    mockCancel.mockResolvedValueOnce({ error: null });
    render(<PendingRedemptionActions redemptionId="7" />);
    fireEvent.click(screen.getByText('t:cancelButton'));
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith('7'));
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('t:cancelSuccess'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows error toast when cancel fails', async () => {
    mockCancel.mockResolvedValueOnce({ error: { message: 'fail' } });
    render(<PendingRedemptionActions redemptionId="7" />);
    fireEvent.click(screen.getByText('t:cancelButton'));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('t:actionError'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
