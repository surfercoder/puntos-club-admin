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
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { completeOnboarding } from '@/actions/onboarding/actions';
import type { OnboardingStep2Data, OnboardingStep4Data } from '@/actions/onboarding/actions';

interface Step5Props {
  existingOrganizationId?: number | null;
  existingOrganizationName?: string;
  step2Data?: OnboardingStep2Data | null;
  step4Data?: OnboardingStep4Data | null;
  selectedPlan?: string;
  mpPreapprovalId?: string | null;
  onBack: () => void;
  onFinish: () => void;
  onCreationComplete?: () => void;
}

type State =
  | { status: 'creating' }
  | { status: 'success'; organizationId: number; orgName: string }
  | { status: 'error'; message: string }
  | { status: 'missing_data' };

// ─── Status screens ──────────────────────────────────────────────────────────

function CreatingScreen({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">{t('settingUp')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{t('settingUpDescription')}</p>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <span>{t('creatingOrg')}</span>
        <span>{t('registeringBranch')}</span>
        <span>{t('configuringPoints')}</span>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onBack,
  onRetry,
  t,
}: {
  message: string;
  onBack: () => void;
  onRetry: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">{t('somethingWentWrong')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {t('reviewBack')}
        </Button>
        <Button type="button" className="gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t('tryAgain')}
        </Button>
      </div>
    </div>
  );
}

function MissingDataScreen({ onBack, t }: { onBack: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/10">
        <AlertCircle className="h-10 w-10 text-brand-orange" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">{t('somethingWentWrong')}</h3>
      </div>
      <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        {t('reviewBack')}
      </Button>
    </div>
  );
}

// ─── QR Success view ─────────────────────────────────────────────────────────

function QRSuccessView({
  organizationId,
  orgName,
  onFinish,
  t,
}: {
  organizationId: number;
  orgName: string;
  onFinish: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({ type: 'organization', id: organizationId, name: orgName });

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
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${orgName}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:white}.container{text-align:center;padding:40px}.brand{font-size:14px;color:#FF4573;margin-bottom:16px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.qr-wrapper{display:inline-block;padding:16px;border:3px solid #31A1D6;border-radius:12px}.org-name{font-size:24px;font-weight:bold;color:#1A1A2E;margin-top:20px}svg{display:block}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="container"><div class="brand">Puntos Club</div><div class="qr-wrapper">${svgData}</div><div class="org-name">${orgName}</div></div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
          <PartyPopper className="h-8 w-8 text-brand-green" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{t('businessReady')}</h3>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <div ref={qrContainerRef} className="rounded-2xl border-4 border-primary bg-white p-6 shadow-lg">
            <QRCodeSVG value={qrData} size={240} bgColor="#ffffff" fgColor="#31A1D6" level="H" includeMargin={false} />
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-foreground">{orgName}</p>
            <p className="text-xs text-muted-foreground">ID: {organizationId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Button type="button" variant="outline" className="gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" /> {t('download')}
        </Button>
        <Button type="button" variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> {t('print')}
        </Button>
        <Button type="button" variant="outline" className="gap-2 col-span-2 sm:col-span-1" onClick={() => toast.info(t('viewQRInPanel'))}>
          <Share2 className="h-4 w-4" /> {t('share')}
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <h4 className="font-semibold text-sm text-foreground">{t('howToUseQR')}</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          {[
            { key: 'step1', text: t('step1') },
            { key: 'step2', text: t('step2') },
            { key: 'step3', text: t('step3') },
          ].map((step, idx) => (
            <li key={step.key} className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                {idx + 1}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="button" variant="outline" className="gap-2 flex-1" onClick={() => window.open('/dashboard/qr', '_blank')}>
          <ExternalLink className="h-4 w-4" /> {t('viewQRInPanel')}
        </Button>
        <Button type="button" className="flex-1" onClick={onFinish}>
          {t('goToDashboard')}
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function Step5QR({
  existingOrganizationId,
  existingOrganizationName,
  step2Data,
  step4Data,
  selectedPlan,
  mpPreapprovalId,
  onBack,
  onFinish,
  onCreationComplete,
}: Step5Props) {
  const t = useTranslations('Onboarding.step6');
  const hasRun = useRef(false);
  const prevStatusRef = useRef<State['status'] | null>(null);

  const [state, setState] = useState<State>(() => {
    if (existingOrganizationId) {
      return { status: 'success', organizationId: existingOrganizationId, orgName: existingOrganizationName ?? '' };
    }
    if (!step2Data) return { status: 'missing_data' };
    return { status: 'creating' };
  });

  useEffect(() => {
    if (hasRun.current) return;
    if (state.status !== 'creating') return;
    hasRun.current = true;

    (async () => {
      let nextState: State;
      try {
        const result = await completeOnboarding({ step2: step2Data!, plan: selectedPlan, mpPreapprovalId: mpPreapprovalId ?? undefined, step4: step4Data });
        nextState = result.success && result.data
          ? { status: 'success', organizationId: result.data.organizationId, orgName: result.data.orgName }
          : { status: 'error', message: result.error ?? 'Error desconocido.' };
      } catch {
        nextState = { status: 'error', message: 'Error de conexión. Por favor intenta de nuevo.' };
      }
      setState(nextState);
    })();
  }, []);

  useEffect(() => {
    if (prevStatusRef.current === 'creating' && state.status === 'success') {
      onCreationComplete?.();
    }
    prevStatusRef.current = state.status;
  }, [state.status, onCreationComplete]);

  const handleRetry = () => {
    hasRun.current = false;
    setState({ status: 'creating' });
  };

  if (state.status === 'creating') return <CreatingScreen t={t} />;
  if (state.status === 'error') return <ErrorScreen message={state.message} onBack={onBack} onRetry={handleRetry} t={t} />;
  if (state.status === 'missing_data') return <MissingDataScreen onBack={onBack} t={t} />;

  return (
    <QRSuccessView
      organizationId={state.organizationId}
      orgName={state.orgName}
      onFinish={onFinish}
      t={t}
    />
  );
}
