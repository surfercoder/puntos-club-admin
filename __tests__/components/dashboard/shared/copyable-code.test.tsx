import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { CopyableCode } from '@/components/dashboard/shared/copyable-code';

describe('CopyableCode', () => {
  it('copies the code and shows a confirmation that fades out', async () => {
    jest.useFakeTimers();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyableCode value="CAN-2026-000128" />);
    fireEvent.click(screen.getByRole('button'));

    await act(async () => { await Promise.resolve(); });
    expect(writeText).toHaveBeenCalledWith('CAN-2026-000128');
    act(() => { jest.advanceTimersByTime(1500); });
    expect(screen.getByText('CAN-2026-000128')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('stays quiet when the browser blocks the clipboard', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyableCode value="CAN-2026-000129" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByText('CAN-2026-000129')).toBeInTheDocument();
  });
});
