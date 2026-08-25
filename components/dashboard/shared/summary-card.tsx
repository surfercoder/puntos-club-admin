export type SummaryRow = {
  label: string;
  value: string;
  /** Resalta el valor en rosa, como los totales de puntos del diseño. */
  highlight?: boolean;
};

export function SummaryCard({
  title,
  action,
  rows,
}: {
  title: string;
  action?: React.ReactNode;
  rows: SummaryRow[];
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      <dl className="mt-4 flex flex-col">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-3 py-2.5 ${
              index === 0 ? "" : "border-t"
            }`}
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd
              className={`shrink-0 text-sm font-bold tabular-nums ${
                row.highlight ? "text-brand-pink" : ""
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
