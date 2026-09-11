import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** Encabezado con la flecha de vuelta que comparten el alta y la edición de
 *  campañas: el título y la bajada son lo único que cambia entre las dos. */
export function CampaignPageHeader({
  back,
  subtitle,
  title,
}: {
  back: string;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Link
        aria-label={back}
        className="mt-1 grid size-9 shrink-0 place-items-center rounded-full border transition-colors hover:bg-accent"
        href="/dashboard/points-rules"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
