'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PUNTOS_CLUB_APK_URL,
  PUNTOS_CLUB_CAJA_APK_URL,
  PUNTOS_CLUB_CAJA_LOGO,
  PUNTOS_CLUB_LOGO,
} from '@/lib/mobile-apps';

const apps = [
  {
    titleKey: 'puntosClubTitle',
    descriptionKey: 'puntosClubDescription',
    url: PUNTOS_CLUB_APK_URL,
    logo: PUNTOS_CLUB_LOGO,
    fileName: 'qr-puntosclub.png',
  },
  {
    titleKey: 'puntosClubCajaTitle',
    descriptionKey: 'puntosClubCajaDescription',
    url: PUNTOS_CLUB_CAJA_APK_URL,
    logo: PUNTOS_CLUB_CAJA_LOGO,
    fileName: 'qr-puntosclub-caja.png',
  },
] as const;

// Carga una imagen ya decodificada; null si falla (el PNG/impresion sigue sin ella).
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  const img = new window.Image();
  img.src = src;
  try {
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

// Renders the app logo + QR (with a title label under it) to a PNG blob for download/share.
async function qrToPngBlob(svgEl: SVGSVGElement, label: string, logo: string): Promise<Blob | null> {
  const qrSize = 400;
  const padding = 40;
  const logoSize = 120;
  const labelHeight = 56;
  const width = qrSize + padding * 2;
  const height = logoSize + padding + qrSize + padding * 2 + labelHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const logoImg = await loadImage(logo);
  if (logoImg) ctx.drawImage(logoImg, (width - logoSize) / 2, padding, logoSize, logoSize);

  const svgData = new XMLSerializer().serializeToString(svgEl);
  // Data URI needs no revoke; avoids an object URL kept alive across the decode await.
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`);
  if (!img) return null;
  const qrTop = padding + logoSize + padding;
  ctx.drawImage(img, padding, qrTop, qrSize, qrSize);

  ctx.fillStyle = '#1A1A2E';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, width / 2, qrTop + qrSize + 36);

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
    const blob = await qrToPngBlob(svgEl, title, app.logo);
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
    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${title}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:white}.container{text-align:center;padding:40px}.logo{width:96px;height:96px;display:block;margin:0 auto 16px}.brand{font-size:14px;color:#FF4573;margin-bottom:16px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.qr-wrapper{display:inline-block;padding:16px;border:3px solid #31A1D6;border-radius:12px}.app-name{font-size:24px;font-weight:bold;color:#1A1A2E;margin-top:20px}.tagline{font-size:14px;color:#6b7280;margin-top:8px}svg{display:block}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="container"><img class="logo" alt=""><div class="brand">Puntos Club</div><div class="qr-wrapper">${svgData}</div><div class="app-name">${title}</div><div class="tagline">${t('scanToDownload')}</div></div></body></html>`);
    printWindow.document.close();
    // El src va por propiedad y no interpolado en el HTML: no es un sink de inyeccion.
    printWindow.document.images[0].src = `${window.location.origin}${app.logo}`;
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleShare = async () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const blob = await qrToPngBlob(svgEl, title, app.logo);
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
        <Image alt="" aria-hidden className="mx-auto mb-2" height={64} src={app.logo} width={64} />
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

        <div className="flex w-full items-center justify-center gap-2">
          {[
            { icon: Download, label: tActions('download'), onClick: handleDownload },
            { icon: Printer, label: tActions('print'), onClick: handlePrint },
            { icon: Share2, label: tActions('share'), onClick: handleShare },
          ].map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onClick} aria-label={label}>
                  <Icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
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
    <TooltipProvider>
      <div className="grid gap-8 sm:grid-cols-2">
        {apps.map((app) => (
          <AppQRCard key={app.titleKey} app={app} />
        ))}
      </div>
    </TooltipProvider>
  );
}
