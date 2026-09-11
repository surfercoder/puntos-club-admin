import { getTranslations } from "next-intl/server";

import { CampaignForm } from "@/components/dashboard/points-rules/campaign-form";
import { CampaignPageHeader } from "@/components/dashboard/points-rules/campaign-page-header";
import { getActiveOrgIdFilter } from "@/lib/auth/get-active-org-id";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

export default async function NewCampaignPage() {
  const [t, currentUser, supabase] = await Promise.all([
    getTranslations("PointsRules.campaignForm"),
    getCurrentUser(),
    createClient(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  if (!orgIdFilter) {
    return <p className="text-sm text-muted-foreground">{t("noOrganization")}</p>;
  }

  const { data: branchRows } = await supabase
    .from("branch")
    .select("id, name")
    .eq("organization_id", orgIdFilter)
    .eq("active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <CampaignPageHeader
        back={t("back")}
        subtitle={t("createSubtitle")}
        title={t("createTitle")}
      />

      <CampaignForm
        branches={(branchRows ?? []).map((branch) => ({
          id: String(branch.id),
          name: branch.name as string,
        }))}
      />
    </div>
  );
}
