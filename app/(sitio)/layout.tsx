import { SiteFooter } from "@/components/sitio/site-footer";
import { SiteHeader } from "@/components/sitio/site-header";

// El sitio público es siempre claro (los mockups no tienen modo oscuro): colores fijos, no tokens del tema.
export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[#fff8fb] font-sans text-sitio-ink">
      <SiteHeader />
      <main className="relative isolate flex-1 overflow-x-clip">{children}</main>
      <SiteFooter />
    </div>
  );
}
