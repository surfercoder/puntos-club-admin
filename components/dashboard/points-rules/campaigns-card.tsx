import { Megaphone } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import DeleteModal from "@/components/dashboard/points-rules/delete-modal";
import { RuleRowActions } from "@/components/dashboard/points-rules/rule-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CAMPAIGN_TABS, type CampaignTab } from "@/lib/utils";


export type Campaign = {
  id: number;
  name: string;
  description: string | null;
  displayIcon: string | null;
  benefit: string;
  benefitDetail: string | null;
  appliesTo: string;
  validity: string;
  schedule: string;
  tab: CampaignTab;
  isActive: boolean;
};

const TAB_STYLES: Record<CampaignTab, string> = {
  active: "bg-brand-green/10 text-brand-green",
  scheduled: "bg-brand-blue/10 text-brand-blue",
  finished: "bg-muted text-muted-foreground",
};

export async function CampaignsCard({
  campaigns,
  tab,
}: {
  campaigns: Campaign[];
  tab: CampaignTab;
}) {
  const t = await getTranslations("PointsRules.campaigns");
  const visible = campaigns.filter((campaign) => campaign.tab === tab);
  const countFor = (key: CampaignTab) => campaigns.filter((c) => c.tab === key).length;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
          <Megaphone className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-brand-violet">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <nav className="mt-5 flex flex-wrap gap-2">
        {CAMPAIGN_TABS.map((key) => (
          <Link
            key={key}
            href={`/dashboard/points-rules?tab=${key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              key === tab ? TAB_STYLES[key] : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {t(`tabs.${key}`, { count: countFor(key) })}
          </Link>
        ))}
      </nav>

      <div className="mt-4 overflow-x-auto">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t("headers.campaign")}</TableHead>
              <TableHead>{t("headers.benefit")}</TableHead>
              <TableHead>{t("headers.appliesTo")}</TableHead>
              <TableHead>{t("headers.validity")}</TableHead>
              <TableHead>{t("headers.status")}</TableHead>
              <TableHead className="text-right">{t("headers.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length > 0 ? (
              visible.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <span className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-violet/10 text-base"
                      >
                        {campaign.displayIcon || "⭐"}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{campaign.name}</span>
                        {campaign.description && (
                          <span className="block text-xs text-muted-foreground">
                            {campaign.description}
                          </span>
                        )}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-semibold text-brand-violet">
                      {campaign.benefit}
                    </span>
                    {campaign.benefitDetail && (
                      <span className="block text-xs text-muted-foreground">
                        {campaign.benefitDetail}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{campaign.appliesTo}</TableCell>
                  <TableCell>
                    <span className="block">{campaign.validity}</span>
                    <span className="block text-xs text-muted-foreground">
                      {campaign.schedule}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TAB_STYLES[campaign.tab]}`}
                    >
                      {t(`status.${campaign.tab}`)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <RuleRowActions ruleId={campaign.id} isActive={campaign.isActive} />
                      <DeleteModal ruleId={campaign.id} ruleName={campaign.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center" colSpan={6}>
                  {t(`empty.${tab}`)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
