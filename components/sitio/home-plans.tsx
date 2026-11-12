import { Bell, Check, Crown, Gift, Palette, Star, Store, Users, Wallet, Zap } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { PlanLimitsByPlan } from "@/components/plan/plan-cards";
import { PlanCta } from "@/components/sitio/plan-cta";
import { rich } from "@/components/sitio/rich";
import { PLAN_CARD_ORDER, PLAN_LIST_PRICES, PLAN_PRICES, UNLIMITED, type PlanCardType } from "@/lib/plans/config";
import { cn } from "@/lib/utils";

const QUOTAS = ["beneficiaries", "redeemable_products", "push_notifications_monthly", "cashiers", "branches"] as const;
const FLAGS = ["beneficiary_map", "private_club", "campaigns"] as const;
const QUOTA_ICONS = { beneficiaries: Users, redeemable_products: Gift, push_notifications_monthly: Bell, cashiers: Wallet, branches: Store };

const STYLES: Record<PlanCardType, { icon: typeof Star; card: string; iconBox: string; price: string; badge: string; cta: string }> = {
  trial: {
    icon: Star,
    card: "bg-[#eaf4ff] ring-[#d6e8fb]",
    iconBox: "bg-[#d4e8fd] text-sitio-blue",
    price: "text-sitio-ink",
    badge: "",
    cta: "border-2 border-sitio-blue bg-white text-sitio-blue hover:bg-[#eef4ff] focus-visible:ring-sitio-blue",
  },
  advance: {
    icon: Zap,
    card: "bg-[#fff3e8] ring-[#fbe2cc]",
    iconBox: "bg-[#ffe1c4] text-[#ff7a1a]",
    price: "text-[#ff4f17]",
    badge: "bg-[#ff5a1f]",
    cta: "bg-[#ff5a1f] text-white hover:bg-[#ec4a10] focus-visible:ring-[#ff5a1f]",
  },
  pro: {
    icon: Crown,
    card: "bg-[#eafaee] ring-[#cdeed6]",
    iconBox: "bg-[#cdf1d8] text-[#0a9d47]",
    price: "text-[#049d44]",
    badge: "bg-[#0a9d47]",
    cta: "bg-[#0a9d47] text-white hover:bg-[#08883d] focus-visible:ring-[#0a9d47]",
  },
};

/** Tarjetas compactas de la home (el mockup 1). La tabla comparativa completa vive en /planes. */
export async function HomePlans({ limits }: { limits: PlanLimitsByPlan }) {
  const [t, tPlan, locale] = await Promise.all([
    getTranslations("Site.plans"),
    getTranslations("Onboarding.step3"),
    getLocale(),
  ]);
  // El español no agrupa 4 cifras por defecto; el diseño pide "1.000".
  const fmt = (n: number) => n.toLocaleString(locale, { useGrouping: "always" });

  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-5">
      {PLAN_CARD_ORDER.map((plan) => {
        const s = STYLES[plan];
        const Icon = s.icon;
        const values = limits[plan];
        const price = Number(PLAN_PRICES[plan]);
        const listPrice = PLAN_LIST_PRICES[plan];
        const rows = [
          ...QUOTAS.map((q) => {
            const v = values?.[q] ?? 0;
            const label = v === UNLIMITED ? t(`${q}Unlimited`) : t.rich(q, { ...rich, n: v, count: fmt(v) });
            return { key: q, label, Icon: QUOTA_ICONS[q] };
          }),
          ...FLAGS.filter((f) => (values?.[f] ?? 0) > 0).map((f) => ({ key: f, label: t(f), Icon: QUOTA_ICONS.beneficiaries })),
        ];
        const whiteLabel = (values?.white_label ?? 0) > 0;

        return (
          <div key={plan} className={cn("relative flex flex-col rounded-3xl p-4 shadow-[0_18px_40px_-24px_rgba(80,40,90,0.35)] ring-1", s.card)}>
            <div className="flex items-start gap-4 px-2 pt-2">
              <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-full", s.iconBox)}>
                <Icon className="size-8" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-xl font-bold text-sitio-ink">{tPlan(`${plan}Plan`)}</p>
                {listPrice && <p className="text-lg font-semibold text-[#9a98ad] line-through">${fmt(listPrice)}</p>}
                <p className={cn("text-[2.4rem] leading-none font-extrabold tracking-tight", s.price)}>
                  {price === 0 ? tPlan("freePriceLabel") : `$${fmt(price)}`}
                </p>
                <p className={cn("text-lg text-sitio-ink", price > 0 && "text-center")}>
                  {price === 0 ? tPlan("trialPriceNote") : tPlan("paidPriceNote")}
                </p>
              </div>
              {listPrice && (
                <div className={cn("absolute top-4 right-4 rounded-lg px-2 py-1 text-center leading-none text-white shadow-sm", s.badge)}>
                  <p className="text-2xl font-extrabold">{tPlan("discountBadge")}</p>
                  <p className="mt-0.5 text-[0.65rem] font-medium">{tPlan("discountNote")}</p>
                </div>
              )}
            </div>

            <ul className="mt-5 flex-1 rounded-2xl bg-white/80 px-4 py-2">
              {rows.map(({ key, label, Icon: RowIcon }) => (
                <li key={key} className="flex items-center gap-4 border-b border-[#efe9f0] py-2.5 text-[0.95rem] last:border-0">
                  {plan === "trial" ? (
                    <RowIcon className="size-5 shrink-0 text-sitio-ink" />
                  ) : (
                    <Check className="size-5 shrink-0 text-[#0a9d47]" strokeWidth={3} />
                  )}
                  <span>{label}</span>
                </li>
              ))}
              {whiteLabel && (
                <li className="-mx-2 mt-1 flex items-center gap-3 rounded-xl bg-[#dcf7e4] px-3 py-2 text-[0.95rem] font-semibold">
                  <Palette className="size-6 shrink-0 text-[#0a9d47]" />
                  {t("white_label")}
                </li>
              )}
            </ul>

            <PlanCta plan={plan} className={cn("mt-5", s.cta)}>
              {tPlan(`cta.${plan}`)}
            </PlanCta>
          </div>
        );
      })}
    </div>
  );
}
