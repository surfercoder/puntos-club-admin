"use client";

import { useTranslations } from "next-intl";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

const SLICES = [
  { key: "pending", color: "var(--brand-orange)" },
  { key: "delivered", color: "var(--brand-green)" },
  { key: "cancelled", color: "var(--brand-pink)" },
] as const;

// Anillo de 132px: radio medio 53 y trazo 18 dan el hueco de 44 y el borde de 62.
const RADIUS = 53;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type RedemptionBreakdown = {
  pending: number;
  delivered: number;
  cancelled: number;
};

export function RedemptionDonut({ data }: { data: RedemptionBreakdown }) {
  const t = useTranslations("Dashboard.redemption");
  const total = data.pending + data.delivered + data.cancelled;

  // Cada porción arranca donde terminó la anterior (offset acumulado).
  let consumed = 0;
  const slices = SLICES.map(({ key, color }) => {
    const share = total === 0 ? 0 : data[key] / total;
    const slice = {
      key,
      label: t(`status.${key}`),
      value: data[key],
      color,
      percent: Math.round(share * 1000) / 10,
      length: share * CIRCUMFERENCE,
      offset: -consumed,
    };
    consumed += slice.length;
    return slice;
  });

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg viewBox="0 0 132 132" className="size-[132px] -rotate-90" aria-hidden="true">
          {slices.map((slice) => (
            <circle
              key={slice.key}
              cx={66}
              cy={66}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE}
              strokeDasharray={`${slice.length} ${CIRCUMFERENCE}`}
              strokeDashoffset={slice.offset}
            />
          ))}
        </svg>
        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{NUMBER_FORMATTER.format(total)}</span>
          <span className="text-[10px] text-muted-foreground">{t("donutTotal")}</span>
        </span>
      </div>

      <ul className="min-w-0 flex-1 space-y-2 text-xs">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {NUMBER_FORMATTER.format(slice.value)} ({slice.percent}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
