"use client"

import * as React from "react"
import {
  MapPin,
  ShoppingBag,
  Smartphone,
  UserCog,
  HeartHandshake,
  Building,
  Store,
  LayoutGrid,
  Building2,
  BellMinus,
  Trophy,
  Package,
  CreditCard,
  BellRing,
  KeyRound,
  Ticket,
  Boxes,
  Shield,
  Users,
  ClipboardList,
  HandHeart,
  Tags,
  Bell,
  Star,
  Receipt,
  Gift,
  LayoutDashboard,
  Map,
  PieChart,
  Frame,
  ShoppingCart,
  QrCode,
} from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("Sidebar")

  const navMain = React.useMemo(() => {
    const isOwnerOrCollaborator = userRole === "owner" || userRole === "collaborator"

    if (portalMode === "admin") {
      const adminEntities = [
        { title: t("addresses"), url: "/dashboard/address", icon: MapPin },
        { title: t("orders"), url: "/dashboard/app_order", icon: ShoppingBag },
        { title: t("appUsers"), url: "/dashboard/app_user", icon: Smartphone },
        { title: t("usersByOrg"), url: "/dashboard/app_user_organization", icon: UserCog },
        { title: t("beneficiaries"), url: "/dashboard/beneficiary", icon: HeartHandshake },
        { title: t("beneficiaryOrgs"), url: "/dashboard/beneficiary_organization", icon: Building },
        { title: t("branches"), url: "/dashboard/branch", icon: Store },
        { title: t("categories"), url: "/dashboard/category", icon: LayoutGrid },
        { title: t("notificationLimits"), url: "/dashboard/organization_notification_limits", icon: BellMinus },
        { title: t("organizations"), url: "/dashboard/organization", icon: Building2 },
        { title: t("pointsRules"), url: "/dashboard/points-rules", icon: Trophy },
        { title: t("products"), url: "/dashboard/product", icon: Package },
        { title: t("purchases"), url: "/dashboard/purchase", icon: CreditCard },
        { title: t("pushNotifications"), url: "/dashboard/push_notifications", icon: BellRing },
        { title: t("pushTokens"), url: "/dashboard/push_tokens", icon: KeyRound },
        { title: t("redemptions"), url: "/dashboard/redemption", icon: Ticket },
        { title: t("stock"), url: "/dashboard/stock", icon: Boxes },
        { title: t("qrCode"), url: "/dashboard/qr", icon: QrCode },
        { title: t("userRoles"), url: "/dashboard/user-role", icon: Shield },
        { title: t("users"), url: "/dashboard/users", icon: Users },
      ]
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))

      return adminEntities
    }

    if (isOwnerOrCollaborator) {
      const ownerEntities = [
        { title: t("qrCode"), url: "/dashboard/qr", icon: QrCode },
        { title: t("orders"), url: "/dashboard/app_order", icon: ClipboardList },
        { title: t("beneficiaries"), url: "/dashboard/beneficiary", icon: HandHeart },
        { title: t("branches"), url: "/dashboard/branch", icon: Store },
        { title: t("categories"), url: "/dashboard/category", icon: Tags },
        { title: t("notifications"), url: "/dashboard/notifications", icon: Bell },
        { title: t("pointsRules"), url: "/dashboard/points-rules", icon: Star },
        { title: t("products"), url: "/dashboard/product", icon: Package },
        { title: t("purchases"), url: "/dashboard/purchase", icon: Receipt },
        { title: t("redemptions"), url: "/dashboard/redemption", icon: Gift },
        { title: t("stock"), url: "/dashboard/stock", icon: Boxes },
        { title: t("users"), url: "/dashboard/users", icon: Users },
      ]
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))

      return ownerEntities
    }

    return [
      {
        title: t("summary"),
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
        items: [{ title: t("panel"), url: "/dashboard" }],
      },
      {
        title: t("points"),
        url: "/dashboard/points-rules",
        icon: Star,
        items: [
          { title: t("pointsRules"), url: "/dashboard/points-rules" },
          { title: t("redemptions"), url: "/dashboard/redemption" },
        ],
      },
      {
        title: t("clients"),
        url: "/dashboard/beneficiary",
        icon: Users,
        items: [
          { title: t("beneficiaries"), url: "/dashboard/beneficiary" },
          { title: t("beneficiaryOrgs"), url: "/dashboard/beneficiary_organization" },
        ],
      },
      {
        title: t("sales"),
        url: "/dashboard/purchase",
        icon: ShoppingCart,
        items: [{ title: t("purchases"), url: "/dashboard/purchase" }],
      },
      {
        title: t("settings"),
        url: "/dashboard/branch",
        icon: Store,
        items: [
          { title: t("branches"), url: "/dashboard/branch" },
          { title: t("addresses"), url: "/dashboard/address" },
          { title: t("categories"), url: "/dashboard/category" },
          { title: t("products"), url: "/dashboard/product" },
          { title: t("stock"), url: "/dashboard/stock" },
          { title: t("users"), url: "/dashboard/users" },
          { title: t("usersByOrg"), url: "/dashboard/app_user_organization" },
        ],
      },
    ]
  }, [portalMode, userRole, t])

  const projects = React.useMemo(
    () => [
      {
        name: t("designEngineering"),
        url: "#",
        icon: Frame,
      },
      {
        name: t("salesMarketing"),
        url: "#",
        icon: PieChart,
      },
      {
        name: t("travel"),
        url: "#",
        icon: Map,
      },
    ],
    [t],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {portalMode === "org" && (
          <OrgSwitcher
            orgs={orgs}
            activeOrgId={activeOrgId}
            onChangeOrg={onChangeOrg}
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
