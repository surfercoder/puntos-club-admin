import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string }) => (
    <svg data-testid="qr-code" data-value={props.value}>QR</svg>
  ),
}));

import { AppDownloadQRCards } from '@/components/mobile-apps/app-download-qr-cards';

// Canvas + Image + serializer mocks so qrToPngBlob runs without a real canvas.
const mockCtx = {
  fillStyle: '',
  font: '',
  textAlign: '',
  fillRect: jest.fn(),
  drawImage: jest.fn(),
  fillText: jest.fn(),
};
const mockToBlob = jest.fn();
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => mockCtx),
  toBlob: mockToBlob,
};

let decodeShouldFail = false;
const originalImage = window.Image;
const originalShare = navigator.share;
const originalCanShare = navigator.canShare;
const origCreateElement = document.createElement.bind(document);
let mockAnchorClick: jest.Mock;

(global as unknown as Record<string, unknown>).XMLSerializer = jest.fn(() => ({
  serializeToString: () => '<svg>mock</svg>',
}));

beforeEach(() => {
  jest.clearAllMocks();
  decodeShouldFail = false;
  mockCanvas.getContext.mockReturnValue(mockCtx);
  mockToBlob.mockImplementation((cb: (b: Blob | null) => void) =>
    cb(new Blob(['mock'], { type: 'image/png' })),
  );

  (window as unknown as Record<string, unknown>).Image = jest.fn(() => ({
    src: '',
    decode: () => (decodeShouldFail ? Promise.reject(new Error('fail')) : Promise.resolve()),
  }));

  mockAnchorClick = jest.fn();
  jest.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
    if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
    const el = origCreateElement(tag, options);
    if (tag === 'a') el.click = mockAnchorClick;
    return el;
  });

  URL.createObjectURL = jest.fn(() => 'blob:url');
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  (window as unknown as Record<string, unknown>).Image = originalImage;
  Object.defineProperty(navigator, 'share', { value: originalShare, writable: true, configurable: true });
  Object.defineProperty(navigator, 'canShare', { value: originalCanShare, writable: true, configurable: true });
  jest.restoreAllMocks();
});

// Buttons per card: [download, print, share]. Two cards => 6 buttons.
const btn = (name: 'download' | 'print' | 'share') =>
  ({ download: 0, print: 1, share: 2 }[name]);

describe('AppDownloadQRCards', () => {
  it('renders both app cards with QR codes and action buttons', () => {
    render(<AppDownloadQRCards />);
    expect(screen.getAllByTestId('qr-code')).toHaveLength(2);
    expect(screen.getByText('puntosClubTitle')).toBeInTheDocument();
    expect(screen.getByText('puntosClubCajaTitle')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('downloads the QR image on download click', async () => {
    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('download')]);
    });
    await waitFor(() => {
      expect(mockAnchorClick).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('download');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
  });

  it('does not download when SVG image fails to decode', async () => {
    decodeShouldFail = true;
    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('download')]);
    });
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('does not download when canvas context is unavailable', async () => {
    mockCanvas.getContext.mockReturnValueOnce(null);
    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('download')]);
    });
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('does nothing on download when no SVG found', async () => {
    const { container } = render(<AppDownloadQRCards />);
    container.querySelectorAll('svg').forEach((s) => s.remove());
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('download')]);
    });
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it('opens a print window and prints', () => {
    const mockPrintWindow = {
      document: { write: jest.fn(), close: jest.fn() },
      focus: jest.fn(),
      print: jest.fn(),
    };
    jest.spyOn(window, 'open').mockReturnValue(mockPrintWindow as unknown as Window);
    jest.useFakeTimers();

    render(<AppDownloadQRCards />);
    fireEvent.click(screen.getAllByRole('button')[btn('print')]);

    const html = mockPrintWindow.document.write.mock.calls[0][0] as string;
    expect(html).toContain('puntosClubTitle');
    expect(mockPrintWindow.document.close).toHaveBeenCalled();
    expect(mockPrintWindow.focus).toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(mockPrintWindow.print).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('shows error toast when print window cannot be opened', () => {
    jest.spyOn(window, 'open').mockReturnValue(null);
    render(<AppDownloadQRCards />);
    fireEvent.click(screen.getAllByRole('button')[btn('print')]);
    expect(toast.error).toHaveBeenCalledWith('printError');
  });

  it('does nothing on print when no SVG found', () => {
    jest.spyOn(window, 'open');
    const { container } = render(<AppDownloadQRCards />);
    container.querySelectorAll('svg').forEach((s) => s.remove());
    fireEvent.click(screen.getAllByRole('button')[btn('print')]);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('shares with files when canShare supports files', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => true), writable: true, configurable: true });

    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array) }));
    });
  });

  it('catches error when sharing with files (user cancelled)', async () => {
    const mockShare = jest.fn().mockRejectedValue(new Error('cancelled'));
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => true), writable: true, configurable: true });

    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('shares without files when canShare returns false', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn(() => false), writable: true, configurable: true });

    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(mockShare.mock.calls[0][0].files).toBeUndefined();
    });
  });

  it('catches error when sharing without files (user cancelled)', async () => {
    const mockShare = jest.fn().mockRejectedValue(new Error('cancelled'));
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true });

    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
  });

  it('falls back to toast.info when navigator.share is undefined', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });

    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('download');
    });
  });

  it('does not share when blob is null', async () => {
    mockToBlob.mockImplementation((cb: (b: Blob | null) => void) => cb(null));
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });

    render(<AppDownloadQRCards />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  it('does nothing on share when no SVG found', async () => {
    const mockShare = jest.fn();
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });

    const { container } = render(<AppDownloadQRCards />);
    container.querySelectorAll('svg').forEach((s) => s.remove());
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button')[btn('share')]);
    });
    await waitFor(() => {
      expect(mockShare).not.toHaveBeenCalled();
    });
  });
});
