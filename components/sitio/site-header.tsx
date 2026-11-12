import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MobileMenu, NavLinks } from "@/components/sitio/nav-links";
import { Cta } from "@/components/sitio/ui";
import { DEMO_HREF } from "@/components/sitio/rich";

export function Logo({ tagline }: { tagline: string }) {
  return (
    <Link href="/" aria-label="Puntos Club" className="flex shrink-0 items-center gap-2">
      <Image src="/images/logos/logo-regalo.png" alt="" width={318} height={318} priority className="size-11 lg:size-13" />
      <span className="leading-none">
        <span className="block text-2xl font-extrabold tracking-tight text-sitio-ink lg:text-[1.7rem]">
          Puntos <span className="text-sitio-pink">Club</span>
        </span>
        <span className="mt-0.5 hidden text-[0.7rem] font-medium text-sitio-ink sm:block">{tagline}</span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const t = await getTranslations("Site");
  const links = [
    { href: "/como-funciona", label: t("nav.howItWorks") },
    { href: "/planes", label: t("nav.plans") },
    { href: "/beneficios", label: t("nav.benefits") },
    { href: "/preguntas-frecuentes", label: t("nav.faq") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#fff8fb]/85 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Logo tagline={t("tagline")} />
        <NavLinks links={links} className="hidden items-center gap-9 xl:flex" />
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="hidden text-sm font-medium text-sitio-ink hover:text-sitio-pink md:block">
            {t("nav.signIn")}
          </Link>
          <Cta href={DEMO_HREF} className="hidden h-11 px-5 text-base sm:inline-flex">
            {t("nav.requestDemo")}
          </Cta>
          <MobileMenu className="group relative xl:hidden">
            <summary
              aria-label={t("nav.openMenu")}
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-sitio-ink hover:bg-white [&::-webkit-details-marker]:hidden"
            >
              <Menu className="size-6" />
            </summary>
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
              <NavLinks links={links} className="flex flex-col gap-1" />
              <div className="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3">
                <Link href="/auth/login" className="py-2 text-[0.95rem] text-sitio-ink">
                  {t("nav.signIn")}
                </Link>
                <Cta href={DEMO_HREF} className="h-11 text-base">
                  {t("nav.requestDemo")}
                </Cta>
              </div>
            </div>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
