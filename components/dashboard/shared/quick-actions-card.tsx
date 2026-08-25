import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

export type QuickAction = {
  href: string;
  icon: LucideIcon;
  /** Clases de fondo + color para el cuadro del ícono. */
  tint: string;
  title: string;
  description: string;
};

export function QuickActionsCard({
  title,
  actions,
}: {
  title: string;
  actions: QuickAction[];
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {/* El título es único dentro de una tarjeta; el href no (hay dos que
            apuntan al mismo listado con distinta acción). */}
        {actions.map(({ href, icon: Icon, tint, title: actionTitle, description }) => (
          <li key={actionTitle}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tint}`}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{actionTitle}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
