'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Info, Printer, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrgQRDisplayProps {
  organizationId: number;
  organizationName: string;
  logoUrl?: string | null;
}

export function OrgQRDisplay({ organizationId, organizationName, logoUrl }: OrgQRDisplayProps) {
  const t = useTranslations('Dashboard.qr.display');
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    type: 'organization',
    id: organizationId,
    name: organizationName,
  });

  const handleDownload = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    const size = 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new window.Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
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
      }, 'image/png');
    };

    img.src = url;
  };

  const handlePrint = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = svgEl.outerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Verifica que no estén bloqueados los pop-ups.');
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
              gap: 8px;
              margin-bottom: 24px;
            }
            .brand-badge {
              background: #059669;
              color: white;
              font-size: 12px;
              font-weight: bold;
              padding: 4px 8px;
              border-radius: 6px;
            }
            .brand-name {
              font-size: 16px;
              font-weight: 600;
              color: #374151;
            }
            .qr-frame {
              display: inline-block;
              padding: 20px;
              border: 4px solid #059669;
              border-radius: 16px;
              background: white;
              box-shadow: 0 4px 20px rgba(5, 150, 105, 0.15);
            }
            .org-name {
              font-size: 28px;
              font-weight: bold;
              color: #111827;
              margin-top: 24px;
            }
            .tagline {
              font-size: 14px;
              color: #6b7280;
              margin-top: 8px;
              line-height: 1.5;
            }
            .footer {
              margin-top: 32px;
              font-size: 11px;
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
              <span class="brand-badge">PC</span>
              <span class="brand-name">Puntos Club</span>
            </div>
            <div class="qr-frame">
              ${svgData}
            </div>
            <div class="org-name">${organizationName}</div>
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
    const shareData = {
      title: `${organizationName} - Puntos Club`,
      text: `Unite a ${organizationName} en Puntos Club y acumula puntos en cada compra.`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      toast.info(t('download'));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col items-center">
        <CardHeader className="w-full pb-3">
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 w-full">
          <div ref={qrContainerRef} className="rounded-2xl border-4 border-emerald-500 bg-white p-6 shadow-md">
            <QRCodeSVG
              value={qrData}
              size={260}
              bgColor="#ffffff"
              fgColor="#059669"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="text-center">
            {logoUrl && (
              <div className="flex justify-center mb-2">
                <NextImage
                  src={logoUrl}
                  alt={organizationName}
                  width={48}
                  height={48}
                  className="rounded-lg object-contain"
                />
              </div>
            )}
            <p className="font-semibold text-gray-900 dark:text-white">{organizationName}</p>
            <p className="text-xs text-muted-foreground">ID: {organizationId}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('download')}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('print')}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('share')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-600" />
              {t('howItWorks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {[
                { id: 'step1', title: t('step1Title'), desc: t('step1Description') },
                { id: 'step2', title: t('step2Title'), desc: t('step2Description') },
                { id: 'step3', title: t('step3Title'), desc: t('step3Description') },
              ].map((item, idx) => (
                <li key={item.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
              {t('tipsTitle')}
            </p>
            <ul className="space-y-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <li>• {t('tip1')}</li>
              <li>• {t('tip2')}</li>
              <li>• {t('tip3')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
