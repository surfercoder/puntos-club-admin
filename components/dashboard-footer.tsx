"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function PuntosClubWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className ?? ""}`}>
      Puntos<span className="text-brand-pink">Club</span>
    </span>
  );
}

export function DashboardFooter() {
  const t = useTranslations("Landing.footer");
  const tFooter = useTranslations("Dashboard.home.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 flex flex-col items-center gap-3 border-t py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
      <PuntosClubWordmark className="text-base text-foreground" />
      <p>{tFooter("copyright", { year })}</p>
      <div className="flex items-center gap-5">
        <Link
          className="transition-colors hover:text-foreground"
          href="/legal/Aviso_Legal.pdf"
          download="Aviso legal"
        >
          {t("terms")}
        </Link>
        <Link
          className="transition-colors hover:text-foreground"
          href="/legal/Politica_de_Privacidad_y_Politica_de_Cookies.pdf"
          download="Politica de Privacidad y Politica de Cookies"
        >
          {t("privacy")}
        </Link>
      </div>
    </footer>
  );
}
