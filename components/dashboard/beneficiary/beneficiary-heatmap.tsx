"use client";

import { Info, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createHeatmapOverlay } from "@/components/dashboard/beneficiary/heatmap-overlay";
import { DASHBOARD_RANGES } from "@/lib/utils";

export type BeneficiaryPoint = {
  latitude: number;
  longitude: number;
  registrationDate: string;
};

// Redondear a 2 decimales (~1 km) es lo que sostiene el aviso de privacidad:
// el mapa muestra zonas, nunca el domicilio de una persona.
const PRECISION = 2;

function roundCoordinate(value: number) {
  return Number(value.toFixed(PRECISION));
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

export function BeneficiaryHeatmap({ points }: { points: BeneficiaryPoint[] }) {
  const t = useTranslations("Dashboard.beneficiary.map");
  const containerRef = useRef<HTMLDivElement>(null);
  const [months, setMonths] = useState<number>(6);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );

  const visiblePoints = useMemo(() => {
    const cutoff = monthsAgo(months);
    return points.filter((p) => new Date(p.registrationDate) >= cutoff);
  }, [points, months]);

  useEffect(() => {
    const container = containerRef.current;
    /* c8 ignore next */
    if (!container) return;

    if (visiblePoints.length === 0) {
      setStatus("empty");
      return;
    }

    let cancelled = false;

    const render = async () => {
      try {
        const { importLibrary } = await import("@googlemaps/js-api-loader");
        const maps = (await importLibrary("maps")) as google.maps.MapsLibrary;
        if (cancelled) return;

        const bounds = new google.maps.LatLngBounds();
        const coordinates = visiblePoints.map((p) => {
          const position = {
            lat: roundCoordinate(p.latitude),
            lng: roundCoordinate(p.longitude),
          };
          bounds.extend(position);
          return position;
        });

        const map = new maps.Map(container, {
          center: bounds.getCenter(),
          zoom: 11,
          disableDefaultUI: true,
          zoomControl: true,
        });
        map.fitBounds(bounds, 48);
        createHeatmapOverlay(map, coordinates);

        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [visiblePoints]);

  return (
    <section
      id="beneficiarios-por-zona"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-semibold">
            {t("title")}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{t("tooltip")}</TooltipContent>
            </Tooltip>
          </h2>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="h-8 w-[150px]" aria-label={t("rangeLabel")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_RANGES.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {t("rangeOption", { months: option })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative h-[290px] overflow-hidden rounded-lg border bg-muted">
        <div ref={containerRef} className="size-full" />
        {status !== "ready" && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
            {t(status)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{t("legendLow")}</span>
        <span className="h-2 flex-1 rounded-full bg-[linear-gradient(90deg,#4BB562_0%,#F8D44C_45%,#FD7E14_75%,#E5352B_100%)]" />
        <span>{t("legendHigh")}</span>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        {t("privacyNote")}
      </p>
    </section>
  );
}
