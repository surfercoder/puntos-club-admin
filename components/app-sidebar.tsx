"use client"

import * as React from "react"
import {
  MapPin,
  ClipboardList,
  User,
  Users,
  HandHeart,
  Building2,
  Store,
  Tags,
  KeyRound,
  Star,
  Package,
  Receipt,
  Gift,
  Boxes,
  LayoutDashboard,
  Map,
  PieChart,
  Frame,
  ShoppingCart,
  Bell,
  BellRing,
  Smartphone,
  Settings,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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

type DashboardSidebarPortalMode = "admin" | "org"

export function AppSidebar({
  user,
  userRole,
  orgs,
  activeOrgId,
  onChangeOrg,
  onLogout,
  portalMode,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: DashboardSidebarUser
  userRole: string | null
  orgs: OrgSwitcherOrg[]
  activeOrgId: string | null
  onChangeOrg: (orgId: string) => void
  onLogout: () => void
  portalMode: DashboardSidebarPortalMode
}) {
  const navMain = React.useMemo(() => {
    const isOwnerOrCollaborator = userRole === "owner" || userRole === "collaborator"

    if (portalMode === "admin") {
      const adminEntities = [
        { title: "Addresses", url: "/dashboard/address", icon: MapPin },
        { title: "App Orders", url: "/dashboard/app_order", icon: ClipboardList },
        { title: "App Users", url: "/dashboard/app_user", icon: User },
        { title: "App User Organizations", url: "/dashboard/app_user_organization", icon: Users },
        { title: "Beneficiaries", url: "/dashboard/beneficiary", icon: HandHeart },
        { title: "Beneficiary Organizations", url: "/dashboard/beneficiary_organization", icon: Building2 },
        { title: "Branches", url: "/dashboard/branch", icon: Store },
        { title: "Categories", url: "/dashboard/category", icon: Tags },
        { title: "Notification Limits", url: "/dashboard/organization_notification_limits", icon: Settings },
        { title: "Organizations", url: "/dashboard/organization", icon: Building2 },
        { title: "Points Rules", url: "/dashboard/points-rules", icon: Star },
        { title: "Product", url: "/dashboard/product", icon: Package },
        { title: "Purchases", url: "/dashboard/purchase", icon: Receipt },
        { title: "Push Notifications", url: "/dashboard/push_notifications", icon: BellRing },
        { title: "Push Tokens", url: "/dashboard/push_tokens", icon: Smartphone },
        { title: "Redemptions", url: "/dashboard/redemption", icon: Gift },
        { title: "Stock", url: "/dashboard/stock", icon: Boxes },
        { title: "User Roles", url: "/dashboard/user-role", icon: KeyRound },
        { title: "Users", url: "/dashboard/users", icon: Users },
      ]
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))

      return adminEntities
    }

    if (isOwnerOrCollaborator) {
      const ownerEntities = [
        { title: "App Orders", url: "/dashboard/app_order", icon: ClipboardList },
        { title: "Beneficiaries", url: "/dashboard/beneficiary", icon: HandHeart },
        { title: "Branches", url: "/dashboard/branch", icon: Store },
        { title: "Categories", url: "/dashboard/category", icon: Tags },
        { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
        { title: "Points Rules", url: "/dashboard/points-rules", icon: Star },
        { title: "Product", url: "/dashboard/product", icon: Package },
        { title: "Purchases", url: "/dashboard/purchase", icon: Receipt },
        { title: "Redemptions", url: "/dashboard/redemption", icon: Gift },
        { title: "Stock", url: "/dashboard/stock", icon: Boxes },
        { title: "Users", url: "/dashboard/users", icon: Users },
      ]
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))

      return ownerEntities
    }

    return [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
        items: [{ title: "Dashboard", url: "/dashboard" }],
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
          { title: "Beneficiary Organizations", url: "/dashboard/beneficiary_organization" },
        ],
      },
      {
        title: "Sales",
        url: "/dashboard/purchase",
        icon: ShoppingCart,
        items: [{ title: "Purchases", url: "/dashboard/purchase" }],
      },
      {
        title: "Setup",
        url: "/dashboard/branch",
        icon: Store,
        items: [
          { title: "Branches", url: "/dashboard/branch" },
          { title: "Addresses", url: "/dashboard/address" },
          { title: "Categories", url: "/dashboard/category" },
          { title: "Products", url: "/dashboard/product" },
          { title: "Stock", url: "/dashboard/stock" },
          { title: "Users", url: "/dashboard/users" },
          { title: "App User Organizations", url: "/dashboard/app_user_organization" },
        ],
      },
    ]
  }, [portalMode, userRole])

  const projects = React.useMemo(
    () => [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
    [],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {portalMode === "org" && (
          <OrgSwitcher
            orgs={orgs}
            activeOrgId={activeOrgId}
            onChangeOrg={onChangeOrg}
            canAddOrganization={userRole === "owner"}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {portalMode !== "admin" && userRole !== "owner" && userRole !== "collaborator" && (
          <NavProjects projects={projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
