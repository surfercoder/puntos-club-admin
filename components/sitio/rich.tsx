import type { ReactNode } from "react";

/** Etiquetas de t.rich que comparten todos los textos del sitio. */
export const rich = {
  hl: (chunks: ReactNode) => <span className="text-sitio-pink">{chunks}</span>,
  b: (chunks: ReactNode) => <strong className="font-bold">{chunks}</strong>,
  small: (chunks: ReactNode) => <span className="text-[0.85em] font-normal">{chunks}</span>,
};

/** Destino de todos los "Solicitar demo": el alta del owner, sin form de contacto. */
export const DEMO_HREF = "/owner/onboarding";
