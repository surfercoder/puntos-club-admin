import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { getOrganizationAddress, getOrganizationSettings } from "@/actions/dashboard/organization/actions"
import { GiftIllustration } from "@/components/dashboard/home/gift-illustration"
import {
  ClubProfileForm,
  type ClubProfileFormAddress,
} from "@/components/dashboard/organization/club-profile-form"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { hasOwnerPermissions } from "@/lib/auth/roles"
import type { Organization } from "@/types/organization"

export default async function OrgSettingsPage() {
  const [t, currentUser] = await Promise.all([
    getTranslations("Dashboard.clubProfile"),
    getCurrentUser(),
  ])
  if (!currentUser || !hasOwnerPermissions(currentUser)) {
    redirect("/dashboard")
  }

  const cookieStore = await cookies()
  const activeOrgId =
    cookieStore.get("active_org_id")?.value ??
    (currentUser.organization_id ? String(currentUser.organization_id) : /* c8 ignore next */ null)

  if (!activeOrgId) {
    redirect("/dashboard")
  }

  const [{ data: org, error }, { data: address }] = await Promise.all([
    getOrganizationSettings(activeOrgId),
    getOrganizationAddress(activeOrgId),
  ])

  if (error || !org) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <GiftIllustration className="hidden h-20 w-28 shrink-0 lg:block" />
      </div>

      <ClubProfileForm
        address={address as ClubProfileFormAddress | null}
        organization={org as unknown as Organization}
      />
    </div>
  )
}
