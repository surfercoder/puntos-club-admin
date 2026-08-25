import { Gift, QrCode, Send, Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  QuickActionsCard,
  type QuickAction,
} from "@/components/dashboard/shared/quick-actions-card";

const ACTIONS = [
  { key: "assignPoints", href: "/dashboard/purchase/create", icon: Send, tint: "bg-brand-violet/10 text-brand-violet" },
  { key: "createBenefit", href: "/dashboard/product/create", icon: Gift, tint: "bg-brand-pink/10 text-brand-pink" },
  { key: "downloadQr", href: "/dashboard/qr", icon: QrCode, tint: "bg-brand-blue/10 text-brand-blue" },
  { key: "viewRedemptions", href: "/dashboard/redemption", icon: Ticket, tint: "bg-brand-green/10 text-brand-green" },
] as const;

export async function QuickActions() {
  const t = await getTranslations("Dashboard.home.quickActions");

  const actions: QuickAction[] = ACTIONS.map(({ key, href, icon, tint }) => ({
    href,
    icon,
    tint,
    title: t(`${key}.title`),
    description: t(`${key}.description`),
  }));

  return <QuickActionsCard title={t("title")} actions={actions} />;
}
