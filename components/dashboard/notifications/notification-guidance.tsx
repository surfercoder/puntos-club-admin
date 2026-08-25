import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Sparkles,
  XCircle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

const AI_CHECKS = ["safe", "aligned", "clear"] as const;
const TIPS = ["short", "urgency", "personalize", "caps", "preview"] as const;
const POLICIES = ["offensive", "sexual", "spam", "misleading", "unrelated", "personal"] as const;

export async function NotificationGuidance() {
  const t = await getTranslations("Dashboard.notifications.guidance");

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="size-4 text-brand-violet" />
          {t("aiTitle")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("aiSubtitle")}</p>

        <ul className="mt-4 space-y-3">
          {AI_CHECKS.map((check) => (
            <li key={check} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
              <span>
                <span className="block text-sm font-medium">{t(`aiChecks.${check}.title`)}</span>
                <span className="block text-xs text-muted-foreground">
                  {t(`aiChecks.${check}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-violet/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {t("aiNote")}
        </p>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="size-4 text-brand-orange" />
          {t("tipsTitle")}
        </h2>
        <ul className="mt-4 space-y-2.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-orange" />
              {t(`tips.${tip}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="size-4 text-brand-pink" />
          {t("policiesTitle")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("policiesSubtitle")}</p>
        <ul className="mt-4 space-y-2.5">
          {POLICIES.map((policy) => (
            <li key={policy} className="flex items-start gap-2.5 text-sm">
              <XCircle className="mt-0.5 size-4 shrink-0 text-brand-pink" />
              {t(`policies.${policy}`)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
