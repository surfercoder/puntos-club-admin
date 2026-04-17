import type * as ReactNS from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string, _params?: Record<string, unknown>) => key;
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string; size: number }) => (
    <svg data-testid="qr-code" data-value={props.value}>QR</svg>
  ),
}));

jest.mock('next/image', () => {
  const React = jest.requireActual('react') as typeof ReactNS;
  return function MockImage({ alt, ...props }: { alt: string; [key: string]: unknown }) {
    return React.createElement('img', { alt, ...props });
  };
});

const mockGenerateQRBlob = jest.fn();
jest.mock('@/components/dashboard/qr/qr-canvas-utils', () => ({
  generateQRBlob: (...args: unknown[]) => mockGenerateQRBlob(...args),
}));

import { QRPreviewCard } from '@/components/dashboard/qr/qr-preview-card';

const originalShare = navigator.share;
const originalCanShare = navigator.canShare;

afterEach(() => {
  Object.defineProperty(navigator, 'share', { value: originalShare, writable: true, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: originalCanShare, writable: true, configurable: true });
  jest.restoreAllMocks();
});

describe('QRPreviewCard', () => {
  const defaultProps = {
    qrData: JSON.stringify({ type: 'organization', id: 1, name: 'Test Org' }),
    organizationName: 'Test Organization',
    logoUrl: null as string | null | undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateQRBlob.mockResolvedValue(new Blob(['mock'], { type: 'image/png' }));
  });

  it('renders the QR code', () => {
    render(<QRPreviewCard {...defaultProps} />);
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('renders the organization name when no logo', () => {
    render(<QRPreviewCard {...defaultProps} />);
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });

  it('renders logo when logoUrl is provided', () => {
    render(<QRPreviewCard {...defaultProps} logoUrl="http://example.com/logo.png" />);
    expect(screen.getByAltText('Test Organization')).toBeInTheDocument();
  });

  it('renders download, print, and share buttons', () => {
    render(<QRPreviewCard {...defaultProps} />);
    expect(screen.getAllByRole('button').length).toBe(3);
  });

  it('renders title, tagline, footer, and LogoTitle', () => {
    render(<QRPreviewCard {...defaultProps} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('printTagline')).toBeInTheDocument();
    expect(screen.getByText('printFooter')).toBeInTheDocument();
    expect(screen.getByAltText('Puntos Club')).toBeInTheDocument();
  });

  it('downloads the QR image on download click', async () => {
    render(<QRPreviewCard {...defaultProps} />);
    const downloadBtn = screen.getAllByRole('button')[0];

    // Now set up mocks for download after render
    const mockClick = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = origCreateElement(tag, options);
      if (tag === 'a') el.click = mockClick;
      return el;
    });
    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    URL.createObjectURL = jest.fn(() => 'blob:url');
    URL.revokeObjectURL = jest.fn();

    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('download');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
  });

  it('does not download when blob is null', async () => {
    mockGenerateQRBlob.mockResolvedValue(null);
    render(<QRPreviewCard {...defaultProps} />);
    const downloadBtn = screen.getAllByRole('button')[0];

    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('opens print window with logoUrl', () => {
    const mockPrintWindow = {
      document: { write: jest.fn(), close: jest.fn() },
      focus: jest.fn(),
      print: jest.fn(),
    };
    jest.spyOn(window, 'open').mockReturnValue(mockPrintWindow as unknown as Window);
    jest.useFakeTimers();

    render(<QRPreviewCard {...defaultProps} logoUrl="http://example.com/logo.png" />);
    fireEvent.click(screen.getAllByRole('button')[1]);

    const html = mockPrintWindow.document.write.mock.calls[0][0] as string;
    expect(html).toContain('http://example.com/logo.png');
    expect(mockPrintWindow.document.close).toHaveBeenCalled();
    expect(mockPrintWindow.focus).toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(mockPrintWindow.print).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('opens print window without logoUrl (shows org name)', () => {
    const mockPrintWindow = {
      document: { write: jest.fn(), close: jest.fn() },
      focus: jest.fn(),
      print: jest.fn(),
    };
    jest.spyOn(window, 'open').mockReturnValue(mockPrintWindow as unknown as Window);

    render(<QRPreviewCard {...defaultProps} />);
    fireEvent.click(screen.getAllByRole('button')[1]);

    const html = mockPrintWindow.document.write.mock.calls[0][0] as string;
    expect(html).toContain('org-name');
    expect(html).toContain('Test Organization');
  });

  it('shows error toast when print window cannot be opened', () => {
    jest.spyOn(window, 'open').mockReturnValue(null);

    render(<QRPreviewCard {...defaultProps} />);
    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(toast.error).toHaveBeenCalledWith('printError');
  });

  it('does nothing on print when no SVG found', () => {
    jest.spyOn(window, 'open');

    const { container } = render(<QRPreviewCard {...defaultProps} />);
    container.querySelector('svg')?.remove();

    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(window.open).not.toHaveBeenCalled();
  });

  it('does not share when blob is null', async () => {
    mockGenerateQRBlob.mockResolvedValue(null);

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  it('shares with files when canShare supports files', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => true), writable: true, configurable: true });

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array) }));
    });
  });

  it('catches error when sharing with files (user cancelled)', async () => {
    const mockShare = jest.fn().mockRejectedValue(new Error('cancelled'));
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => true), writable: true, configurable: true });

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('shares without files when canShare returns false', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => false), writable: true, configurable: true });

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      const callArgs = mockShare.mock.calls[0][0];
      expect(callArgs.files).toBeUndefined();
    });
  });

  it('catches error when sharing without files (user cancelled)', async () => {
    const mockShare = jest.fn().mockRejectedValue(new Error('cancelled'));
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => false), writable: true, configurable: true });

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('falls back to toast.info when navigator.share is undefined', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('download');
    });
  });

  it('shares without files when canShare is undefined', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true });

    render(<QRPreviewCard {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[2]);
    });

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Organization - Puntos Club' }),
      );
    });
  });
});
