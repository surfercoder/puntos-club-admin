'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PUNTOS_CLUB_APK_URL, PUNTOS_CLUB_CAJA_APK_URL } from '@/lib/mobile-apps';

const apps = [
  {
    titleKey: 'puntosClubTitle',
    descriptionKey: 'puntosClubDescription',
    url: PUNTOS_CLUB_APK_URL,
    fileName: 'qr-puntosclub.png',
  },
  {
    titleKey: 'puntosClubCajaTitle',
    descriptionKey: 'puntosClubCajaDescription',
    url: PUNTOS_CLUB_CAJA_APK_URL,
    fileName: 'qr-puntosclub-caja.png',
  },
] as const;

// Renders the QR (with a title label under it) to a PNG blob for download/share.
async function qrToPngBlob(svgEl: SVGSVGElement, label: string): Promise<Blob | null> {
  const qrSize = 400;
  const padding = 40;
  const labelHeight = 56;
  const width = qrSize + padding * 2;
  const height = qrSize + padding * 2 + labelHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const img = new window.Image();
  // Data URI needs no revoke; avoids an object URL kept alive across the decode await.
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  try {
    await img.decode();
  } catch {
    return null;
  }
  ctx.drawImage(img, padding, padding, qrSize, qrSize);

  ctx.fillStyle = '#1A1A2E';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, width / 2, qrSize + padding + 36);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

function AppQRCard({ app }: { app: (typeof apps)[number] }) {
  const t = useTranslations('MobileApps');
  // Reuse the org QR action labels so all cards read identically.
  const tActions = useTranslations('Dashboard.qr.display');
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const title = t(app.titleKey);

  const handleDownload = async () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const blob = await qrToPngBlob(svgEl, title);
    if (!blob) return;

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = app.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    toast.success(tActions('download'));
  };

  const handlePrint = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = svgEl.outerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(tActions('printError'));
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${title}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:white}.container{text-align:center;padding:40px}.brand{font-size:14px;color:#FF4573;margin-bottom:16px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.qr-wrapper{display:inline-block;padding:16px;border:3px solid #31A1D6;border-radius:12px}.app-name{font-size:24px;font-weight:bold;color:#1A1A2E;margin-top:20px}.tagline{font-size:14px;color:#6b7280;margin-top:8px}svg{display:block}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="container"><div class="brand">Puntos Club</div><div class="qr-wrapper">${svgData}</div><div class="app-name">${title}</div><div class="tagline">${t('scanToDownload')}</div></div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleShare = async () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const blob = await qrToPngBlob(svgEl, title);
    if (!blob) return;

    const file = new File([blob], app.fileName, { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: `${title} - Puntos Club`, text: t('scanToDownload'), files: [file] });
      } catch {
        // User cancelled
      }
    } else if (navigator.share) {
      try {
        await navigator.share({ title: `${title} - Puntos Club`, text: t('scanToDownload') });
      } catch {
        // User cancelled
      }
    } else {
      toast.info(tActions('download'));
    }
  };

  return (
    <Card className="flex flex-col items-center">
      <CardHeader className="w-full pb-3 text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{t(app.descriptionKey)}</p>
      </CardHeader>
      <CardContent className="flex w-full flex-col items-center gap-4">
        <div ref={qrContainerRef} className="rounded-2xl border-4 border-primary bg-white p-6 shadow-md">
          <QRCodeSVG
            value={app.url}
            size={200}
            bgColor="#ffffff"
            fgColor="#31A1D6"
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t('scanToDownload')}</p>

        <div className="grid w-full grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="size-3.5" />
            <span className="hidden sm:inline">{tActions('download')}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="size-3.5" />
            <span className="hidden sm:inline">{tActions('print')}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">{tActions('share')}</span>
          </Button>
        </div>

        <Button asChild className="w-full sm:hidden">
          <a href={app.url} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 size-4" />
            {t('download')}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// The download QRs for the beneficiary + cashier apps. Shown on the mobile-apps page,
// the dashboard QR page, and the last onboarding step.
export function AppDownloadQRCards() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {apps.map((app) => (
        <AppQRCard key={app.titleKey} app={app} />
      ))}
    </div>
  );
}
