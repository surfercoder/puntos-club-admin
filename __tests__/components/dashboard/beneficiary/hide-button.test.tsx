import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HideButton } from '@/components/dashboard/beneficiary/hide-button';
import { useRouter } from 'next/navigation';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  EyeOff: () => <span data-testid="eye-off-icon" />,
  Eye: () => <span data-testid="eye-icon" />,
}));

describe('HideButton', () => {
  const mockRefresh = jest.fn();
  const mockFetch = global.fetch as jest.Mock;

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

  it('renders Eye icon when not hidden', () => {
    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={false} />
    );
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('renders EyeOff icon when hidden', () => {
    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={true} />
    );
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
  });

  it('calls fetch with correct payload to hide a beneficiary', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={false} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/beneficiary/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary_id: 'b-1',
          organization_id: 'org-1',
          is_hidden: true,
        }),
      });
    });
  });

  it('calls fetch with correct payload to unhide a beneficiary', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={true} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/beneficiary/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary_id: 'b-1',
          organization_id: 'org-1',
          is_hidden: false,
        }),
      });
    });
  });

  it('calls router.refresh on successful response', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={false} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('does not call router.refresh on failed response', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={false} />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('re-enables button after fetch completes', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(
      <HideButton beneficiaryId="b-1" organizationId="org-1" isHidden={false} />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
