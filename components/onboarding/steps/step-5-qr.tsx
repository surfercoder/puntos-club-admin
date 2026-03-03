'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  PartyPopper,
  Printer,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { completeOnboarding } from '@/actions/onboarding/actions';
import type { OnboardingStep2Data, OnboardingStep4Data } from '@/actions/onboarding/actions';

interface Step5Props {
  /** Present when the user already completed onboarding in a previous session. */
  existingOrganizationId?: number | null;
  existingOrganizationName?: string;
  /** Collected during this session (steps 2–4). */
  step2Data?: OnboardingStep2Data | null;
  step4Data?: OnboardingStep4Data | null;
  selectedPlan?: string;
  onBack: () => void;
  onFinish: () => void;
  /** Called immediately after org is successfully created — clears onboarding localStorage */
  onCreationComplete?: () => void;
}

type State =
  | { status: 'creating' }
  | { status: 'success'; organizationId: number; orgName: string }
  | { status: 'error'; message: string }
  | { status: 'missing_data' };

export function Step5QR({
  existingOrganizationId,
  existingOrganizationName,
  step2Data,
  step4Data,
  selectedPlan,
  onBack,
  onFinish,
  onCreationComplete,
}: Step5Props) {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  const [state, setState] = useState<State>(() => {
    if (existingOrganizationId) {
      return {
        status: 'success',
        organizationId: existingOrganizationId,
        orgName: existingOrganizationName ?? '',
      };
    }
    if (!step2Data) {
      return { status: 'missing_data' };
    }
    return { status: 'creating' };
  });

  useEffect(() => {
    if (hasRun.current) return;
    if (state.status !== 'creating') return;
    hasRun.current = true;

    completeOnboarding({ step2: step2Data!, plan: selectedPlan, step4: step4Data })
      .then((result) => {
        if (result.success && result.data) {
          onCreationComplete?.();
          setState({
            status: 'success',
            organizationId: result.data.organizationId,
            orgName: result.data.orgName,
          });
        } else {
          setState({ status: 'error', message: result.error ?? 'Error desconocido.' });
        }
      })
      .catch(() => {
        setState({ status: 'error', message: 'Error de conexión. Por favor intenta de nuevo.' });
      });
  }, []);

  const handleRetry = () => {
    hasRun.current = false;
    setState({ status: 'creating' });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state.status === 'creating') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Configurando tu negocio...
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Estamos creando tu organización, sucursal y catálogo. Esto solo tomará un momento.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span>✓ Creando organización</span>
          <span>✓ Registrando sucursal</span>
          <span>✓ Configurando regla de puntos</span>
          {step4Data && <span>✓ Guardando catálogo de premios</span>}
          {step2Data?.cashier?.email && <span>✓ Creando acceso del cajero</span>}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Algo salió mal
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">{state.message}</p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Volver a revisar
          </Button>
          <Button
            type="button"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  // ── Missing data (refreshed page without prior completion) ─────────────────
  if (state.status === 'missing_data') {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertCircle className="h-10 w-10 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Faltan datos del negocio
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Es posible que hayas recargado la página. Por favor regresa al paso 2 y completa
            los datos de tu negocio para continuar.
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Volver al paso 2
        </Button>
      </div>
    );
  }

  // ── Success — show QR ──────────────────────────────────────────────────────
  const { organizationId, orgName } = state;

  const qrData = JSON.stringify({
    type: 'organization',
    id: organizationId,
    name: orgName,
  });

  const handleDownload = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const canvas = document.createElement('canvas');
    const size = 400;
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
        a.download = `qr-${orgName.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        toast.success('QR descargado correctamente');
      }, 'image/png');
    };

    img.src = url;
  };

  const handlePrint = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = svgEl.outerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR - ${orgName}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, sans-serif;
              background: white;
            }
            .container { text-align: center; padding: 40px; }
            .brand { font-size: 14px; color: #6b7280; margin-bottom: 16px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
            .qr-wrapper { display: inline-block; padding: 16px; border: 3px solid #059669; border-radius: 12px; }
            .org-name { font-size: 24px; font-weight: bold; color: #111827; margin-top: 20px; }
            .subtitle { font-size: 14px; color: #6b7280; margin-top: 8px; }
            svg { display: block; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">Puntos Club</div>
            <div class="qr-wrapper">${svgData}</div>
            <div class="org-name">${orgName}</div>
            <div class="subtitle">Escanea este QR para unirte y ganar puntos</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            ¡Tu negocio está listo!
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Este es el QR de <strong>{orgName}</strong>. Tus clientes lo escanean para
            unirse y empezar a acumular puntos.
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <div
            ref={qrContainerRef}
            className="rounded-2xl border-4 border-emerald-500 bg-white p-6 shadow-lg"
          >
            <QRCodeSVG
              value={qrData}
              size={240}
              bgColor="#ffffff"
              fgColor="#059669"
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{orgName}</p>
            <p className="text-xs text-muted-foreground">ID: {organizationId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Button type="button" variant="outline" className="gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Descargar
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2 col-span-2 sm:col-span-1"
          onClick={() => toast.info('Podrás volver a ver e imprimir este QR desde tu panel de control.')}
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">¿Cómo usar el QR?</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">1</span>
            <span>Imprime el QR y colócalo en un lugar visible de tu local</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">2</span>
            <span>Tus clientes lo escanean desde la app PuntosClub para unirse</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">3</span>
            <span>Tu cajero usa la app PuntosClubCaja para registrar compras y acumular puntos</span>
          </li>
        </ol>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="gap-2 flex-1"
          onClick={() => window.open('/dashboard/qr', '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Ver QR en el panel
        </Button>
        <Button
          type="button"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          onClick={onFinish}
        >
          Ir al panel de control
        </Button>
      </div>
    </div>
  );
}
