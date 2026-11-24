import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string }) => <svg data-testid="qr-code" data-value={props.value} />,
}));

import { AppDownloadQRCards } from '@/components/mobile-apps/app-download-qr-cards';
import { PUNTOS_CLUB_CAJA_WEB_URL, PUNTOS_CLUB_PLAY_URL, PUNTOS_CLUB_WEB_URL } from '@/lib/mobile-apps';

const writeText = jest.fn();
Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

beforeEach(() => jest.clearAllMocks());

describe('AppDownloadQRCards', () => {
  it('renders Play + web QRs for both apps with the real URLs', () => {
    render(<AppDownloadQRCards />);
    const values = screen.getAllByTestId('qr-code').map((el) => el.getAttribute('data-value'));
    // Caja todavia no esta en Play: su QR de Play es un placeholder tapado.
    expect(values).toEqual([PUNTOS_CLUB_PLAY_URL, PUNTOS_CLUB_WEB_URL, PUNTOS_CLUB_CAJA_WEB_URL, PUNTOS_CLUB_CAJA_WEB_URL]);
    expect(values.some((v) => v?.includes('drive.google.com'))).toBe(false);
    expect(screen.getByText('soon')).toBeInTheDocument();
    expect(screen.getByText('playSoonHint')).toBeInTheDocument();
    expect(screen.getByText('puntosClubCajaWebHint')).toBeInTheDocument();
  });

  it('links every available QR to its URL and leaves the "coming soon" one inert', () => {
    render(<AppDownloadQRCards />);
    const links = screen.getAllByRole('link', { name: 'openLink' }).map((a) => a.getAttribute('href'));
    expect(links).toEqual([PUNTOS_CLUB_PLAY_URL, PUNTOS_CLUB_WEB_URL, PUNTOS_CLUB_CAJA_WEB_URL]);
  });

  it('disables printing only for the "coming soon" Play QR', () => {
    render(<AppDownloadQRCards />);
    const print = screen.getAllByRole('button', { name: /printQr/ });
    expect(print.map((b) => (b as HTMLButtonElement).disabled)).toEqual([false, false, true, false]);
  });

  it('copies the web app link', async () => {
    writeText.mockResolvedValueOnce(undefined);
    render(<AppDownloadQRCards />);
    fireEvent.click(screen.getAllByRole('button', { name: /copyLink/ })[1]);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('linkCopied'));
    expect(writeText).toHaveBeenCalledWith(PUNTOS_CLUB_CAJA_WEB_URL);
  });

  it('shows an error when the clipboard rejects', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    render(<AppDownloadQRCards />);
    fireEvent.click(screen.getAllByRole('button', { name: /copyLink/ })[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('copyError'));
  });

  it('opens a print window with the QR and the app logo', () => {
    jest.useFakeTimers();
    const img = { src: '' };
    const printWindow = {
      document: { write: jest.fn(), close: jest.fn(), images: [img] },
      focus: jest.fn(),
      print: jest.fn(),
    };
    const open = jest.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);
    render(<AppDownloadQRCards />);
    fireEvent.click(screen.getAllByRole('button', { name: /printQr/ })[0]);
    expect(printWindow.document.write).toHaveBeenCalledWith(expect.stringContaining('data-value="' + PUNTOS_CLUB_PLAY_URL));
    expect(img.src).toContain('/images/logos/app-puntosclub-v2.png');
    act(() => jest.advanceTimersByTime(500));
    expect(printWindow.print).toHaveBeenCalled();
    open.mockRestore();
    jest.useRealTimers();
  });

  it('does nothing when the QR svg is not mounted', () => {
    const open = jest.spyOn(window, 'open');
    render(<AppDownloadQRCards />);
    const qs = jest.spyOn(Element.prototype, 'querySelector').mockReturnValue(null);
    fireEvent.click(screen.getAllByRole('button', { name: /printQr/ })[0]);
    qs.mockRestore();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('toasts when the print popup is blocked', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    render(<AppDownloadQRCards />);
    fireEvent.click(screen.getAllByRole('button', { name: /printQr/ })[1]);
    expect(toast.error).toHaveBeenCalledWith('printError');
    open.mockRestore();
  });
});
