"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import OrganizationForm from "@/components/dashboard/organization/organization-form"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type OrgSwitcherOrg = {
  id: string
  name: string
  logo_url?: string | null
}

export type OrgSwitcherProps = {
  orgs: OrgSwitcherOrg[]
  activeOrgId: string | null
  onChangeOrg: (orgId: string) => void
  canAddOrganization?: boolean
}

export function OrgSwitcher({
  orgs,
  activeOrgId,
  onChangeOrg,
  canAddOrganization,
}: OrgSwitcherProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const t = useTranslations("Navigation")
  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0]
  const [isAddOrgOpen, setIsAddOrgOpen] = React.useState(false)

  React.useEffect(() => {
    if (!activeOrgId && orgs[0]) {
      onChangeOrg(orgs[0].id)
    }
  }, [activeOrgId, onChangeOrg, orgs])

  if (!activeOrg) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground">
                {activeOrg.logo_url ? (
                  <Image src={activeOrg.logo_url} alt={activeOrg.name} width={32} height={32} className="size-8 object-contain" />
                ) : (
                  <span className="text-xs font-semibold">{activeOrg.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrg.name}</span>
                <span className="truncate text-xs">{t("organization")}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t("organizations")}
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => onChangeOrg(org.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border overflow-hidden">
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt={org.name} width={24} height={24} className="size-6 object-contain" />
                  ) : (
                    <span className="text-xs font-semibold">{org.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                {org.name}
              </DropdownMenuItem>
            ))}
            {/* <DropdownMenuSeparator /> */}
            {canAddOrganization ? (
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setIsAddOrgOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Plus className="h-4 w-4" />
                </div>
                {t("addNewOrganization")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isAddOrgOpen} onOpenChange={setIsAddOrgOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addNewOrganization")}</DialogTitle>
            </DialogHeader>
            <OrganizationForm
              onCancel={() => setIsAddOrgOpen(false)}
              onSuccess={() => {
                setIsAddOrgOpen(false)
                router.refresh()
              }}
              redirectTo={""}
            />
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
