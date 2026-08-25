import { CheckCircle2, Eye, Send, Smartphone, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type NotificationDetail = {
  sent: number;
  delivered: number;
  failed: number;
};

/**
 * Panel que se despliega bajo la fila. El envío siempre va a todos los
 * beneficiarios activos en Android e iOS, así que esos datos son fijos.
 */
export async function NotificationDetailRow({ data }: { data: NotificationDetail }) {
  const t = await getTranslations("Dashboard.notifications.detail");
  const rate = data.sent === 0 ? 0 : Math.round((data.delivered / data.sent) * 100);

  const steps = [
    { key: "sent", value: data.sent, icon: Send, tint: "text-brand-violet" },
    { key: "delivered", value: data.delivered, icon: CheckCircle2, tint: "text-brand-green" },
    { key: "failed", value: data.failed, icon: TriangleAlert, tint: "text-brand-pink" },
  ] as const;

  return (
    <div className="grid gap-6 rounded-xl bg-muted/40 p-5 md:grid-cols-[240px_1fr]">
      <dl className="space-y-3 text-xs">
        <div className="flex items-start gap-2">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <dt className="text-muted-foreground">{t("type")}</dt>
            <dd className="font-medium">{t("typeGlobal")}</dd>
          </div>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("segment")}</dt>
          <dd className="font-medium">{t("segmentAll")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("platform")}</dt>
          <dd className="font-medium">{t("platformBoth")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("action")}</dt>
          <dd className="font-medium">{t("actionOpenApp")}</dd>
        </div>
      </dl>

      <div className="min-w-0 border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
        <p className="text-sm font-semibold">{t("performance")}</p>

        <ol className="mt-4 flex flex-wrap items-center gap-4">
          {steps.map(({ key, value, icon: Icon, tint }, index) => (
            <li key={key} className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <Icon className={`size-5 ${tint}`} />
                <span>
                  <span className="block text-sm font-bold">
                    {NUMBER_FORMATTER.format(value)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {t(`steps.${key}`)}
                  </span>
                </span>
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className="text-muted-foreground">→</span>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            {t("deliveryRate")}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-brand-violet"
                style={{ width: `${rate}%` }}
              />
            </span>
            <span className="shrink-0 text-lg font-bold">{rate}%</span>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          {t("openRatePending")}
        </p>
      </div>
    </div>
  );
}
