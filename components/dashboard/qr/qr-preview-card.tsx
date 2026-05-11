'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateQRBlob } from './qr-canvas-utils';

interface QRPreviewCardProps {
  qrData: string;
  organizationName: string;
  logoUrl?: string | null;
}

export function QRPreviewCard({ qrData, organizationName, logoUrl }: QRPreviewCardProps) {
  const t = useTranslations('Dashboard.qr.display');
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const blob = await generateQRBlob(qrContainerRef, t, organizationName, logoUrl);
    if (!blob) return;

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `qr-${organizationName.toLowerCase().replace(/\s+/g, '-')}-puntosclub.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    toast.success(t('download'));
  };

  const handlePrint = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = svgEl.outerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('printError'));
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${organizationName} | Puntos Club</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .page {
              text-align: center;
              padding: 48px;
              max-width: 480px;
            }
            .brand-header {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 24px;
            }
            .brand-header img {
              height: 48px;
              width: auto;
            }
            .qr-frame {
              display: inline-block;
              padding: 20px;
              border: 4px solid #31A1D6;
              border-radius: 16px;
              background: white;
            }
            .org-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 24px;
            }
            .org-logo {
              height: 56px;
              width: auto;
              object-fit: contain;
              border-radius: 8px;
            }
            .org-name {
              font-size: 28px;
              font-weight: bold;
              color: #1A1A2E;
            }
            .tagline {
              font-size: 15px;
              color: #6b7280;
              margin-top: 16px;
              line-height: 1.5;
            }
            .footer {
              margin-top: 12px;
              font-size: 12px;
              color: #9ca3af;
            }
            svg { display: block; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="brand-header">
              <img src="/images/logos/LogoTitle.png" alt="Puntos Club" />
            </div>
            <div class="qr-frame">
              ${svgData}
            </div>
            <div class="org-section">
              ${logoUrl ? `<img src="${logoUrl}" alt="${organizationName}" class="org-logo" />` : `<div class="org-name">${organizationName}</div>`}
            </div>
            <div class="tagline">${t('printTagline')}</div>
            <div class="footer">${t('printFooter')}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleShare = async () => {
    const blob = await generateQRBlob(qrContainerRef, t, organizationName, logoUrl);
    if (!blob) return;

    const file = new File(
      [blob],
      `qr-${organizationName.toLowerCase().replace(/\s+/g, '-')}-puntosclub.png`,
      { type: 'image/png' },
    );

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `${organizationName} - Puntos Club`,
          text: t('shareText', { name: organizationName }),
          files: [file],
        });
      } catch {
        // User cancelled
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: `${organizationName} - Puntos Club`,
          text: t('shareText', { name: organizationName }),
        });
      } catch {
        // User cancelled
      }
    } else {
      toast.info(t('download'));
    }
  };

  return (
    <Card className="flex flex-col items-center">
      <CardHeader className="w-full pb-3">
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-col items-center gap-4 bg-white rounded-xl p-6 w-full">
          <NextImage
            src="/images/logos/LogoTitle.png"
            alt="Puntos Club"
            width={180}
            height={48}
            className="object-contain"
          />

          <div ref={qrContainerRef} className="rounded-2xl border-4 border-primary bg-white p-5">
            <QRCodeSVG
              value={qrData}
              size={260}
              bgColor="#ffffff"
              fgColor="#31A1D6"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            {logoUrl ? (
              <div className="flex justify-center">
                <NextImage
                  src={logoUrl}
                  alt={organizationName}
                  width={56}
                  height={56}
                  className="rounded-lg object-contain"
                />
              </div>
            ) : (
              <p className="text-2xl font-bold text-foreground">{organizationName}</p>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {t('printTagline')}
          </p>
          <p className="text-xs text-muted-foreground/60 text-center">
            {t('printFooter')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="size-3.5" />
            <span className="hidden sm:inline">{t('download')}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="size-3.5" />
            <span className="hidden sm:inline">{t('print')}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">{t('share')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
