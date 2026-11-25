'use client';

import { useRef, type RefObject } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Link2, Monitor, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PUNTOS_CLUB_CAJA_LOGO,
  PUNTOS_CLUB_CAJA_WEB_URL,
  PUNTOS_CLUB_LOGO,
  PUNTOS_CLUB_PLAY_URL,
  PUNTOS_CLUB_WEB_URL,
} from '@/lib/mobile-apps';

// playUrl null = todavia no tiene ficha publica en Play: el QR sale tapado con "Próximamente".
const apps = [
  {
    key: 'puntosClub',
    logo: PUNTOS_CLUB_LOGO,
    mascot: '/images/qr/clubi-beneficiario.png',
    playUrl: PUNTOS_CLUB_PLAY_URL,
    webUrl: PUNTOS_CLUB_WEB_URL,
    color: '#FF4573',
    panel: 'border-brand-pink/30 bg-brand-pink/5',
    tile: 'bg-brand-pink/10',
    text: 'text-brand-pink',
    badge: 'bg-brand-pink/15 text-brand-pink',
  },
  {
    key: 'puntosClubCaja',
    logo: PUNTOS_CLUB_CAJA_LOGO,
    mascot: '/images/qr/clubi-caja.png',
    playUrl: null,
    webUrl: PUNTOS_CLUB_CAJA_WEB_URL,
    color: '#4BB562',
    panel: 'border-brand-green/30 bg-brand-green/5',
    tile: 'bg-brand-green/10',
    text: 'text-brand-green',
    badge: 'bg-brand-green text-white',
  },
] as const;

type App = (typeof apps)[number];

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24">
      <path d="M4 2.5 14.5 12 4 21.5c-.3-.2-.5-.6-.5-1v-17c0-.4.2-.8.5-1Z" fill="#00D7FE" />
      <path d="m17.6 9-3.1 3L4 2.5c.2-.1.6-.1.9.1L17.6 9Z" fill="#32BB5D" />
      <path d="m17.6 15-12.7 6.4c-.3.2-.7.2-.9.1L14.5 12l3.1 3Z" fill="#F33A49" />
      <path d="m21.3 13.1-3.7 1.9-3.1-3 3.1-3 3.7 1.9c.8.5.8 1.7 0 2.2Z" fill="#FFC900" />
    </svg>
  );
}

// Claves de i18n de cada tile: la web siempre tiene link; Play puede estar "Próximamente".
function tileKeys(app: App, kind: 'play' | 'web', soon: boolean) {
  if (kind === 'web') return { subtitle: 'webSubtitle', hint: `${app.key}WebHint` } as const;
  return soon ? ({ subtitle: 'playSoonSubtitle', hint: 'playSoonHint' } as const) : ({ subtitle: 'playSubtitle', hint: 'playHint' } as const);
}

// Abre una ventana con el QR listo para imprimir. false = el navegador bloqueo el popup.
function printQr(svgEl: SVGSVGElement, app: App, appTitle: string, tagline: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${appTitle}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:white}.container{text-align:center;padding:40px}.logo{width:96px;height:96px;display:block;margin:0 auto 16px}.brand{font-size:14px;color:#FF4573;margin-bottom:16px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}.qr-wrapper{display:inline-block;padding:16px;border:3px solid ${app.color};border-radius:12px}.app-name{font-size:24px;font-weight:bold;color:#1A1A2E;margin-top:20px}.tagline{font-size:14px;color:#6b7280;margin-top:8px}svg{display:block}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="container"><img class="logo" alt=""><div class="brand">Puntos Club</div><div class="qr-wrapper">${svgEl.outerHTML}</div><div class="app-name">${appTitle}</div><div class="tagline">${tagline}</div></div></body></html>`);
  printWindow.document.close();
  // El src va por propiedad y no interpolado en el HTML: no es un sink de inyeccion.
  printWindow.document.images[0].src = `${window.location.origin}${app.logo}`;
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
  return true;
}

function QRBox({ app, url, qrRef }: { app: App; url: string | null; qrRef: RefObject<HTMLDivElement | null> }) {
  const t = useTranslations('MobileApps');
  if (url === null) {
    return (
      <div ref={qrRef} className="relative rounded-xl border-2 border-muted-foreground/40 bg-white p-3">
        <QRCodeSVG value={app.webUrl} size={144} fgColor="#9ca3af" level="H" className="opacity-40 blur-[2px]" />
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-12 rounded-full bg-muted py-1 text-sm font-bold text-muted-foreground shadow">
          {t('soon')}
        </span>
      </div>
    );
  }
  return (
    <div ref={qrRef} className="relative rounded-xl border-2 bg-white p-3" style={{ borderColor: app.color }}>
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t('openLink')}>
        <QRCodeSVG value={url} size={144} fgColor={app.color} level="H" />
      </a>
    </div>
  );
}

function QRTile({
  app,
  appTitle,
  url,
  kind,
}: {
  app: App;
  appTitle: string;
  url: string | null;
  kind: 'play' | 'web';
}) {
  const t = useTranslations('MobileApps');
  const tActions = useTranslations('Dashboard.qr.display');
  const qrRef = useRef<HTMLDivElement>(null);
  const soon = url === null;
  const keys = tileKeys(app, kind, soon);
  const title = t(kind === 'play' ? 'playTitle' : 'webTitle');
  const subtitle = t(keys.subtitle);

  const handlePrint = () => {
    const svgEl = qrRef.current?.querySelector('svg');
    if (svgEl && !printQr(svgEl, app, appTitle, `${title} ${subtitle}`)) toast.error(tActions('printError'));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url as string);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('copyError'));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className={cn('flex min-h-20 w-full items-center justify-center gap-3 rounded-xl px-3 py-2', soon ? 'bg-muted' : app.tile)}>
        {kind === 'play' ? <PlayIcon className="size-7 shrink-0" /> : <Monitor className={cn('size-7 shrink-0', app.text)} />}
        <div className="text-left leading-tight">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm">{subtitle}</p>
        </div>
      </div>

      <QRBox app={app} url={url} qrRef={qrRef} />

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={soon} onClick={handlePrint} className={cn(!soon && app.text)}>
          <Printer className="size-4" />
          {t('printQr')}
        </Button>
        {kind === 'web' && (
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} className={app.text}>
            <Link2 className="size-4" />
            {t('copyLink')}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{t(keys.hint)}</p>
    </div>
  );
}

// Los QR de las apps de beneficiario y caja (Play Store + web app). Se muestran en
// /dashboard/qr, en /mobile-apps y en el ultimo paso del onboarding.
export function AppDownloadQRCards() {
  const t = useTranslations('MobileApps');
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {apps.map((app) => {
        const title = t(`${app.key}Title`);
        return (
          <section key={app.key} className={cn('rounded-2xl border p-4 sm:p-6', app.panel)}>
            <header className="mb-5 flex items-center gap-4">
              {/* Clubi apoyado sobre la card blanca de los QR, como en el mockup. */}
              <Image alt="" aria-hidden height={160} src={app.mascot} width={140} className="-mb-5 hidden h-40 w-auto shrink-0 self-end sm:block" />
              <Image alt="" aria-hidden height={64} src={app.logo} width={64} className="shrink-0 rounded-full" />
              <div>
                <h3 className="text-2xl font-bold">{title}</h3>
                <span className={cn('mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-semibold', app.badge)}>
                  {t(`${app.key}Badge`)}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">{t(`${app.key}Description`)}</p>
              </div>
            </header>
            <div className="grid gap-6 rounded-xl bg-card p-4 sm:grid-cols-2 sm:divide-x">
              <QRTile app={app} appTitle={title} url={app.playUrl} kind="play" />
              <QRTile app={app} appTitle={title} url={app.webUrl} kind="web" />
            </div>
          </section>
        );
      })}
    </div>
  );
}
