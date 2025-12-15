"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Star,
  Users,
  ShoppingCart,
  Store,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { OrgSwitcher, type OrgSwitcherOrg } from "@/components/org-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export type DashboardSidebarUser = {
  name: string
  email: string
  avatar?: string
}

export function AppSidebar({
  user,
  orgs,
  activeOrgId,
  onChangeOrg,
  onLogout,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: DashboardSidebarUser
  orgs: OrgSwitcherOrg[]
  activeOrgId: string | null
  onChangeOrg: (orgId: string) => void
  onLogout: () => void
}) {
  const navMain = React.useMemo(
    () => [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
        items: [
          { title: "Dashboard", url: "/dashboard" },
        ],
      },
      {
        title: "Points",
        url: "/dashboard/points-rules",
        icon: Star,
        items: [
          { title: "Points Rules", url: "/dashboard/points-rules" },
          { title: "Redemptions", url: "/dashboard/redemption" },
        ],
      },
      {
        title: "Customers",
        url: "/dashboard/beneficiary",
        icon: Users,
        items: [
          { title: "Beneficiaries", url: "/dashboard/beneficiary" },
        ],
      },
      {
        title: "Sales",
        url: "/dashboard/purchase",
        icon: ShoppingCart,
        items: [
          { title: "Purchases", url: "/dashboard/purchase" },
        ],
      },
      {
        title: "Setup",
        url: "/dashboard/branch",
        icon: Store,
        items: [
          { title: "Branches", url: "/dashboard/branch" },
          { title: "Products", url: "/dashboard/product" },
        ],
      },
    ],
    [],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher
          orgs={orgs}
          activeOrgId={activeOrgId}
          onChangeOrg={onChangeOrg}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
