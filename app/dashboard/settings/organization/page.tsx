import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Settings } from "lucide-react"

import { getOrganizationSettings } from "@/actions/dashboard/organization/actions"
import { OrgVisibilityToggle } from "@/components/dashboard/organization/org-visibility-toggle"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { isOwner, isAdmin } from "@/lib/auth/roles"

export default async function OrgSettingsPage() {
  const t = await getTranslations("Dashboard.orgSettings")

  const currentUser = await getCurrentUser()
  if (!currentUser || (!isOwner(currentUser) && !isAdmin(currentUser))) {
    redirect("/dashboard")
  }

  const cookieStore = await cookies()
  const activeOrgId =
    cookieStore.get("active_org_id")?.value ??
    (currentUser.organization_id ? String(currentUser.organization_id) : /* c8 ignore next */ null)

  if (!activeOrgId) {
    redirect("/dashboard")
  }

  const { data: org, error } = await getOrganizationSettings(activeOrgId)

  if (error || !org) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Settings className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{org.name}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">{t("visibilityTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("visibilityDescription")}</p>
        </div>
        <OrgVisibilityToggle
          orgId={activeOrgId}
          initialIsPublic={/* c8 ignore next */ org.is_public ?? true}
        />
      </div>
    </div>
  )
}
