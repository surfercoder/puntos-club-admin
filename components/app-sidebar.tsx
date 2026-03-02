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
        { title: "Direcciones", url: "/dashboard/address", icon: MapPin },
        { title: "Pedidos", url: "/dashboard/app_order", icon: ShoppingBag },
        { title: "Usuarios de la App", url: "/dashboard/app_user", icon: Smartphone },
        { title: "Usuarios por Organización", url: "/dashboard/app_user_organization", icon: UserCog },
        { title: "Beneficiarios", url: "/dashboard/beneficiary", icon: HeartHandshake },
        { title: "Organizaciones de Beneficiarios", url: "/dashboard/beneficiary_organization", icon: Building },
        { title: "Sucursales", url: "/dashboard/branch", icon: Store },
        { title: "Categorías", url: "/dashboard/category", icon: LayoutGrid },
        { title: "Límites de Notificaciones", url: "/dashboard/organization_notification_limits", icon: BellMinus },
        { title: "Organizaciones", url: "/dashboard/organization", icon: Building2 },
        { title: "Reglas de Puntos", url: "/dashboard/points-rules", icon: Trophy },
        { title: "Productos", url: "/dashboard/product", icon: Package },
        { title: "Compras", url: "/dashboard/purchase", icon: CreditCard },
        { title: "Notificaciones Push", url: "/dashboard/push_notifications", icon: BellRing },
        { title: "Tokens Push", url: "/dashboard/push_tokens", icon: KeyRound },
        { title: "Canjes", url: "/dashboard/redemption", icon: Ticket },
        { title: "Stock", url: "/dashboard/stock", icon: Boxes },
        { title: "Código QR", url: "/dashboard/qr", icon: QrCode },
        { title: "Roles de Usuario", url: "/dashboard/user-role", icon: Shield },
        { title: "Usuarios", url: "/dashboard/users", icon: Users },
      ]
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))

      return adminEntities
    }

    if (isOwnerOrCollaborator) {
      const ownerEntities = [
        { title: "Código QR", url: "/dashboard/qr", icon: QrCode },
        { title: "Pedidos", url: "/dashboard/app_order", icon: ClipboardList },
        { title: "Beneficiarios", url: "/dashboard/beneficiary", icon: HandHeart },
        { title: "Sucursales", url: "/dashboard/branch", icon: Store },
        { title: "Categorías", url: "/dashboard/category", icon: Tags },
        { title: "Notificaciones", url: "/dashboard/notifications", icon: Bell },
        { title: "Reglas de Puntos", url: "/dashboard/points-rules", icon: Star },
        { title: "Productos", url: "/dashboard/product", icon: Package },
        { title: "Compras", url: "/dashboard/purchase", icon: Receipt },
        { title: "Canjes", url: "/dashboard/redemption", icon: Gift },
        { title: "Stock", url: "/dashboard/stock", icon: Boxes },
        { title: "Usuarios", url: "/dashboard/users", icon: Users },
      ]
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))

      return ownerEntities
    }

    return [
      {
        title: "Resumen",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
        items: [{ title: "Panel", url: "/dashboard" }],
      },
      {
        title: "Puntos",
        url: "/dashboard/points-rules",
        icon: Star,
        items: [
          { title: "Reglas de Puntos", url: "/dashboard/points-rules" },
          { title: "Canjes", url: "/dashboard/redemption" },
        ],
      },
      {
        title: "Clientes",
        url: "/dashboard/beneficiary",
        icon: Users,
        items: [
          { title: "Beneficiarios", url: "/dashboard/beneficiary" },
          { title: "Organizaciones de Beneficiarios", url: "/dashboard/beneficiary_organization" },
        ],
      },
      {
        title: "Ventas",
        url: "/dashboard/purchase",
        icon: ShoppingCart,
        items: [{ title: "Compras", url: "/dashboard/purchase" }],
      },
      {
        title: "Configuración",
        url: "/dashboard/branch",
        icon: Store,
        items: [
          { title: "Sucursales", url: "/dashboard/branch" },
          { title: "Direcciones", url: "/dashboard/address" },
          { title: "Categorías", url: "/dashboard/category" },
          { title: "Productos", url: "/dashboard/product" },
          { title: "Stock", url: "/dashboard/stock" },
          { title: "Usuarios", url: "/dashboard/users" },
          { title: "Usuarios por Organización", url: "/dashboard/app_user_organization" },
        ],
      },
    ]
  }, [portalMode, userRole])

  const projects = React.useMemo(
    () => [
      {
        name: "Ingeniería de diseño",
        url: "#",
        icon: Frame,
      },
      {
        name: "Ventas y marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Viajes",
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
