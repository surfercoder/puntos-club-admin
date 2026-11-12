import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Los tres trazos amarillos que acompañan títulos y a Clubi. */
export function Sparks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("size-10 text-[#FFC21A]", className)}>
      <g stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
        <path d="M8 4l4 9" />
        <path d="M24 6l-7 9" />
        <path d="M36 18l-11 4" />
      </g>
    </svg>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border-2 border-[#7FE0B8] bg-[#C8F5E3] px-5 py-1.5 text-lg font-bold text-[#04603A] lg:text-xl">
      {children}
    </span>
  );
}

const CTA_VARIANTS = {
  blue: "bg-sitio-blue text-white shadow-[0_8px_20px_-8px_rgba(0,98,254,0.7)] hover:bg-[#0052d6]",
  pink: "bg-sitio-pink text-white shadow-[0_8px_20px_-8px_rgba(254,14,97,0.7)] hover:bg-[#e00552]",
  outline: "border-2 border-sitio-blue bg-white text-sitio-ink hover:bg-[#eef4ff]",
};

export function Cta({
  href,
  children,
  variant = "blue",
  arrow = true,
  icon,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof CTA_VARIANTS;
  arrow?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-13 items-center justify-center gap-3 rounded-full px-7 text-lg font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-sitio-blue focus-visible:ring-offset-2 focus-visible:outline-none",
        CTA_VARIANTS[variant],
        className
      )}
    >
      {icon}
      {children}
      {arrow && <ArrowRight className="size-5" strokeWidth={2.5} />}
    </Link>
  );
}

/** Manchas pastel del fondo de los mockups. */
export function Blob({ className }: { className: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute -z-10 rounded-full blur-3xl", className)} />;
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-3xl font-extrabold tracking-tight text-sitio-ink sm:text-4xl lg:text-[2.75rem] lg:leading-tight", className)}>
      {children}
    </h2>
  );
}
