import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LinkAllBeneficiariesPage from '@/app/dashboard/beneficiary/link-all/page';
import { linkAllUnlinkedBeneficiaries } from '@/actions/dashboard/beneficiary/link-to-organization';

jest.mock('@/actions/dashboard/beneficiary/link-to-organization', () => ({
  linkAllUnlinkedBeneficiaries: jest.fn(),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; [k: string]: unknown }) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('LinkAllBeneficiariesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a default function (client component)', () => {
    expect(typeof LinkAllBeneficiariesPage).toBe('function');
  });

  it('renders without crashing', () => {
    render(<LinkAllBeneficiariesPage />);
    expect(screen.getByText('linkButton')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<LinkAllBeneficiariesPage />);
    expect(screen.getByText('backButton')).toBeInTheDocument();
  });

  it('handles successful linking', async () => {
    (linkAllUnlinkedBeneficiaries as jest.Mock).mockResolvedValue({
      data: { message: 'Linked 5 beneficiaries' },
      error: null,
    });

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('linkButton'));

    // Should show loading state
    expect(screen.getByText('linking')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Linked 5 beneficiaries')).toBeInTheDocument();
    });
  });

  it('handles successful linking with default message', async () => {
    (linkAllUnlinkedBeneficiaries as jest.Mock).mockResolvedValue({
      data: { message: null },
      error: null,
    });

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('linkButton'));

    await waitFor(() => {
      expect(screen.getByText('linkSuccess')).toBeInTheDocument();
    });
  });

  it('handles linking error from API', async () => {
    (linkAllUnlinkedBeneficiaries as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Permission denied' },
    });

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('linkButton'));

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
    });
  });

  it('handles linking error with default message', async () => {
    (linkAllUnlinkedBeneficiaries as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: null },
    });

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('linkButton'));

    await waitFor(() => {
      expect(screen.getByText('linkFailed')).toBeInTheDocument();
    });
  });

  it('handles unexpected exceptions', async () => {
    (linkAllUnlinkedBeneficiaries as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('linkButton'));

    await waitFor(() => {
      expect(screen.getByText('unexpectedError')).toBeInTheDocument();
    });
  });

  it('navigates back to beneficiaries page on back button click', () => {
    const { useRouter } = require('next/navigation');
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock, replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn() });

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('backButton'));

    expect(pushMock).toHaveBeenCalledWith('/dashboard/beneficiary');
  });

  it('disables buttons while loading', async () => {
    let resolveLink: (v: unknown) => void;
    (linkAllUnlinkedBeneficiaries as jest.Mock).mockImplementation(() => new Promise(r => { resolveLink = r; }));

    render(<LinkAllBeneficiariesPage />);
    fireEvent.click(screen.getByText('linkButton'));

    // Both buttons should be disabled while loading
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });

    resolveLink!({ data: { message: 'Done' }, error: null });

    await waitFor(() => {
      const btns = screen.getAllByRole('button');
      btns.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
