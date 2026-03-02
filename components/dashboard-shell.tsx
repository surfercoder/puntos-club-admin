"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";

type DashboardShellUser = {
  name: string;
  email: string;
  avatar?: string;
};

type DashboardShellOrg = {
  id: string;
  name: string;
};

type DashboardShellPortalMode = "admin" | "org";

export function DashboardShell({
  children,
  user,
  userRole,
  orgs,
  portalMode,
}: {
  children: React.ReactNode;
  user: DashboardShellUser;
  userRole: string | null;
  orgs: DashboardShellOrg[];
  portalMode: DashboardShellPortalMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeOrgId, setActiveOrgId] = React.useState<string | null>(null);

  const breadcrumbItems = React.useMemo(() => {
    const segmentLabels: Record<string, string> = {
      address: "Direcciones",
      app_order: "Pedidos",
      app_user: "Usuarios de la App",
      app_user_organization: "Usuarios por Organización",
      beneficiary: "Beneficiarios",
      beneficiary_organization: "Organizaciones de Beneficiarios",
      branch: "Sucursales",
      category: "Categorías",
      notifications: "Notificaciones",
      organization: "Organizaciones",
      organization_notification_limits: "Límites de Notificaciones",
      "points-rules": "Reglas de Puntos",
      product: "Productos",
      profile: "Perfil",
      purchase: "Compras",
      push_notifications: "Notificaciones Push",
      push_tokens: "Tokens Push",
      redemption: "Canjes",
      stock: "Stock",
      "user-role": "Roles de Usuario",
      users: "Usuarios",
    };

    const isUuidLike = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const rawSegments = (pathname ?? "")
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .filter(Boolean);

    const dashboardIndex = rawSegments.indexOf("dashboard");
    const segments = dashboardIndex >= 0 ? rawSegments.slice(dashboardIndex + 1) : rawSegments;

    const items: { label: string; href?: string }[] = [{ label: "Panel", href: "/dashboard" }];

    let hrefAcc = "/dashboard";
    for (const seg of segments) {
      hrefAcc += `/${seg}`;

      let label = segmentLabels[seg] ?? seg;
      if (seg === "new") label = "Nuevo";
      if (seg === "edit") label = "Editar";
      if (isUuidLike(seg) || /^\d+$/.test(seg)) label = "Detalles";

      items.push({ label, href: hrefAcc });
    }

    // Last item should be current page (no link)
    if (items.length > 0) items[items.length - 1] = { label: items[items.length - 1].label };

    return items;
  }, [pathname]);

  React.useEffect(() => {
    if (portalMode === "admin") return;
    try {
      const stored = window.localStorage.getItem("active_org_id");
      if (stored) setActiveOrgId(stored);
    } catch {
      // ignore
    }
  }, [portalMode]);

  const onChangeOrg = React.useCallback((orgId: string) => {
    if (portalMode === "admin") return;
    setActiveOrgId(orgId);
    try {
      window.localStorage.setItem("active_org_id", orgId);
    } catch {
      // ignore
    }

    fetch("/api/active-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    }).catch(() => {
      // ignore
    })

    // Dispatch custom event to notify components of org change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orgChanged', { detail: { orgId } }));
    }
  }, [portalMode]);

  const onLogout = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        userRole={userRole}
        orgs={orgs}
        activeOrgId={activeOrgId}
        onChangeOrg={onChangeOrg}
        onLogout={onLogout}
        portalMode={portalMode}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, idx) => {
                  const isLast = idx === breadcrumbItems.length - 1;

                  return (
                    <React.Fragment key={`${item.label}-${idx}`}>
                      <BreadcrumbItem className={idx === 0 ? "hidden md:block" : undefined}>
                        {isLast || !item.href ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col px-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
