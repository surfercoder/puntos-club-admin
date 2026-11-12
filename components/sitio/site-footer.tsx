import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/sitio/site-header";

export async function SiteFooter() {
  const t = await getTranslations("Site");
  const links = [
    { href: "/como-funciona", label: t("nav.howItWorks") },
    { href: "/planes", label: t("nav.plans") },
    { href: "/beneficios", label: t("nav.benefits") },
    { href: "/preguntas-frecuentes", label: t("nav.faq") },
    { href: "/contacto", label: t("footer.contact") },
  ];

  return (
    <footer className="border-t border-[#f3dbe6] bg-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <Logo tagline={t("tagline")} />
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-sitio-ink">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-sitio-pink">
              {l.label}
            </Link>
          ))}
        </nav>
        <LanguageSwitcher />
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pb-8 text-xs text-[#5b5b7a] sm:flex-row sm:gap-6 sm:px-6 lg:px-10">
        <Link href="/legal/terminos" className="hover:text-sitio-pink">
          {t("footer.terms")}
        </Link>
        <Link href="/legal/privacidad" className="hover:text-sitio-pink">
          {t("footer.privacy")}
        </Link>
        <a href="mailto:hola@puntosclub.com.ar" className="hover:text-sitio-pink">
          hola@puntosclub.com.ar
        </a>
        <span className="sm:ml-auto">{t("footer.copyright", { year: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}
