import { Info } from "lucide-react";

export function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-blue/10 text-brand-blue">
          <Info className="size-4" />
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
