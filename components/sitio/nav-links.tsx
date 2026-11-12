"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function NavLinks({ links, className }: { links: { href: string; label: string }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative block py-2 text-[0.95rem] whitespace-nowrap text-sitio-ink transition-colors hover:text-sitio-pink",
                active &&
                  "font-semibold after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-[#06CB83]"
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** <details> nativo que se cierra al navegar: el layout no se desmonta, el key por ruta sí lo remonta. */
export function MobileMenu({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <details key={usePathname()} className={className}>
      {children}
    </details>
  );
}
