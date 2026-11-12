import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** La banda verde-rosada que cierra cada página, con una ilustración asomando. */
export function CtaBand({ children, art, className }: { children: ReactNode; art?: ReactNode; className?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-10">
      <div
        className={cn(
          "relative flex flex-col gap-6 rounded-[2.5rem] bg-[linear-gradient(100deg,#d9f6e8_0%,#e8f8ef_45%,#fdeaf2_100%)] px-6 py-10 sm:px-12 lg:flex-row lg:items-center",
          className
        )}
      >
        {children}
        {art}
      </div>
    </section>
  );
}
