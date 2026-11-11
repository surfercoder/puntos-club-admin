"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronRight,
  EllipsisVertical,
  Share,
  SquarePlus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// Tarjeta "Instalá la app en tu celular" (ticket de acceso directo, 11/11/2026),
// la misma que las dos webapps. Solo en celulares, solo en el navegador (ya
// instalada no tiene sentido) y una sola vez: cerrarla de cualquier forma la
// descarta.
const DISMISSED_KEY = "install-prompt-dismissed";

// Clubi con el celular y la capa, recortado del mockup con su fondo: la
// izquierda se funde con un mask para que no se vea el borde del rectangulo.
const MASCOT = "/images/install/clubi-celular.png";
const ICON = "/pwa/icon-192.png";

// Muestreados del mockup. La tarjeta no sigue el modo oscuro a proposito: es
// la ilustracion del mockup, con su fondo horneado en el PNG.
const ACCENT = "#FE2A74";
const ACCENT_SOFT = "#FDE5EE";
const CARD_BG = "#FEF2F6";
const INK = "#0A053D";
const INK_SOFT = "#5D5D75";

type Platform = "ios" | "android";

// Solo Chromium dispara `beforeinstallprompt`, por eso no esta en lib.dom.
type InstallEvent = Event & { prompt: () => Promise<unknown> };

function detectPlatform(): Platform | null {
  try {
    if (localStorage.getItem(DISMISSED_KEY)) return null;
  } catch {
    // Sin storage (modo privado estricto) se ofrece igual.
  }
  const standalone =
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (standalone || !matchMedia("(pointer: coarse)").matches) return null;
  // El iPad con iPadOS se anuncia como Mac: lo delata la pantalla tactil.
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "android";
}

const noSubscribe = () => () => {};

export function InstallPrompt() {
  // En el servidor no hay navegador que mirar: el HTML sale sin la tarjeta y
  // aparece al hidratar, sin mismatch.
  const platform = React.useSyncExternalStore(
    noSubscribe,
    detectPlatform,
    () => null,
  );
  const [closed, setClosed] = React.useState(false);

  if (!platform || closed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Sin storage vuelve a aparecer en la proxima visita: no es grave.
    }
    setClosed(true);
  };

  return <InstallDialog platform={platform} onClose={dismiss} />;
}

function Step({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex w-[30%] flex-col items-center text-center">
      <span
        className="relative z-10 -mb-2 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-bold text-white"
        style={{ background: ACCENT }}
      >
        {n}
      </span>
      {icon}
      <span
        className="mt-2 text-[11.5px] leading-[15px]"
        style={{ color: INK_SOFT }}
      >
        {children}
      </span>
    </li>
  );
}

const Chevron = () => (
  <ChevronRight
    aria-hidden
    size={16}
    className="mt-[42px] shrink-0 text-[#9CA0B5]"
  />
);

const Wordmark = ({ className }: { className?: string }) => (
  <span className={className}>
    Puntos <span style={{ color: ACCENT }}>Club</span>
  </span>
);

function InstallDialog({
  platform,
  onClose,
}: {
  platform: Platform;
  onClose: () => void;
}) {
  const t = useTranslations("InstallPrompt");
  const [installEvent, setInstallEvent] = React.useState<InstallEvent | null>(
    null,
  );

  // Chrome en Android deja instalar con un click: se guarda el evento y se
  // dispara desde el boton. Sin el (iOS, Firefox, Samsung) quedan los pasos.
  // Escucha solo con la tarjeta abierta: en la compu, o ya descartada, el
  // navegador conserva su propia UI de instalacion.
  React.useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    addEventListener("beforeinstallprompt", onPrompt);
    return () => removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (installEvent) await installEvent.prompt();
    onClose();
  };
  const circle =
    "flex h-[52px] w-[52px] items-center justify-center rounded-full";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="block max-h-[calc(100dvh-24px)] max-w-[380px] overflow-y-auto rounded-[28px] border-0 p-0 pb-5 sm:max-w-[380px]"
        style={{ background: CARD_BG, color: INK }}
      >
        <div className="relative px-5 pb-6 pt-5">
          <Image
            src={MASCOT}
            alt=""
            width={382}
            height={435}
            priority
            className="pointer-events-none absolute bottom-0 right-0 h-auto w-[54%]"
            style={{
              maskImage: "linear-gradient(to right, transparent, #000 22%)",
            }}
          />
          <div className="relative flex items-center gap-2.5">
            <Image src={ICON} alt="" width={44} height={44} />
            <div className="flex flex-col items-start">
              <Wordmark className="text-[22px] font-extrabold leading-none" />
              <span
                className="mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: ACCENT_SOFT, color: ACCENT }}
              >
                {t("badge")}
              </span>
            </div>
          </div>
          <DialogTitle className="relative mt-5 max-w-[58%] whitespace-pre-line text-[28px] font-extrabold leading-[1.08]">
            {t("title")}
            <br />
            <span style={{ color: ACCENT }}>{t("titleAccent")}</span>
          </DialogTitle>
          <DialogDescription
            className="relative mt-2 max-w-[50%] text-[13px] leading-[18px]"
            style={{ color: INK_SOFT }}
          >
            {t("subtitle")}
          </DialogDescription>
        </div>

        <div className="relative mx-4 rounded-[22px] bg-white px-3 pb-4 pt-4 shadow-[0px_6px_20px_rgba(23,10,60,0.06)]">
          <h3 className="px-1 text-[17px] font-bold">{t("easy")}</h3>
          <ol className="mt-3 flex items-start justify-between">
            <Step
              n={1}
              icon={
                <span className={circle} style={{ background: ACCENT_SOFT }}>
                  {platform === "ios" ? (
                    <Share size={22} />
                  ) : (
                    <EllipsisVertical size={22} />
                  )}
                </span>
              }
            >
              {t(`${platform}.step1Lead`)}
              <b className="block" style={{ color: INK }}>
                {t(`${platform}.step1`)}
              </b>
            </Step>
            <Chevron />
            <Step
              n={2}
              icon={
                <span className={circle} style={{ background: ACCENT_SOFT }}>
                  <SquarePlus size={22} />
                </span>
              }
            >
              {t(`${platform}.step2Lead`)}
              <b className="block" style={{ color: INK }}>
                {t(`${platform}.step2`)}
              </b>
            </Step>
            <Chevron />
            <Step
              n={3}
              icon={<Image src={ICON} alt="" width={52} height={52} />}
            >
              <b className="block" style={{ color: INK }}>
                {t("step3Lead")}
              </b>
              {t("step3")} <Wordmark className="font-bold" />
            </Step>
          </ol>
        </div>

        <button
          type="button"
          onClick={install}
          className="mx-4 mt-5 flex h-14 w-[calc(100%-32px)] items-center justify-center gap-3 rounded-full text-[18px] font-bold text-white transition-opacity active:opacity-80"
          style={{ background: ACCENT }}
        >
          {installEvent ? t("cta") : t("gotIt")}
          <ArrowRight size={22} />
        </button>
        <p
          className="mt-3 text-center text-[13px]"
          style={{ color: INK_SOFT }}
        >
          {t("footer")} 💗
        </p>
      </DialogContent>
    </Dialog>
  );
}
