"use client"

import * as React from "react"
import { Globe, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { updateOrganizationVisibility } from "@/actions/dashboard/organization/actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface OrgVisibilityToggleProps {
  orgId: string
  initialIsPublic: boolean
}

export function OrgVisibilityToggle({ orgId, initialIsPublic }: OrgVisibilityToggleProps) {
  const t = useTranslations("Dashboard.orgSettings")
  const [isPublic, setIsPublic] = React.useState(initialIsPublic)
  const [isPending, setIsPending] = React.useState(false)

  async function handleToggle(checked: boolean) {
    setIsPending(true)
    const prev = isPublic
    setIsPublic(checked)

    const result = await updateOrganizationVisibility(orgId, checked)

    if (result.error) {
      setIsPublic(prev)
      toast.error(t("updateError"))
    } else {
      toast.success(checked ? t("madePublicSuccess") : t("madePrivateSuccess"))
    }

    setIsPending(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            {isPublic ? (
              <Globe className="size-4 text-muted-foreground" />
            ) : (
              <Lock className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="org-visibility" className="text-base font-medium cursor-pointer">
              {isPublic ? t("visibilityPublic") : t("visibilityPrivate")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPublic ? t("visibilityPublicDescription") : t("visibilityPrivateDescription")}
            </p>
          </div>
        </div>
        <Switch
          id="org-visibility"
          checked={isPublic}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={t("visibilityToggleLabel")}
        />
      </div>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">{t("qrNoteTitle")}</p>
        <p>{t("qrNoteDescription")}</p>
      </div>
    </div>
  )
}
