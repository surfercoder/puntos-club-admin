"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import Link from "next/link";
import { Bell } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardTour } from "@/components/dashboard/tour/dashboard-tour";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanUsageProvider } from "@/components/providers/plan-usage-provider";
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
import type { OrganizationUsageSummary } from "@/types/plan";

type DashboardShellUser = {
  name: string;
  email: string;
  avatar?: string;
};

type DashboardShellOrg = {
  id: string;
  name: string;
  logo_url?: string | null;
};

type DashboardShellPortalMode = "admin" | "org";

const KNOWN_SEGMENTS = [
  "address", "app_user", "app_user_organization",
  "beneficiary", "beneficiary_organization", "branch",
  "notifications", "organization", "organization_notification_limits",
  "points-rules", "product", "profile", "purchase", "push_notifications", "mother",
  "push_tokens", "redemption", "user-role", "users", "qr", "cashiers", "collaborators",
  "settings", "organization-settings",
] as const;

type KnownSegment = typeof KNOWN_SEGMENTS[number];

// Segmentos que solo agrupan rutas y no tienen page.tsx propio: enlazarlos da 404.
const NON_ROUTABLE_SEGMENTS = new Set(["settings", "edit", "view"]);

const isKnownSegment = (s: string): s is KnownSegment =>
  (KNOWN_SEGMENTS as readonly string[]).includes(s);

const isUuidLike = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function DashboardShell({
  children,
  user,
  userId,
  userRole,
  tourCompleted,
  orgs,
  portalMode,
  initialPlanUsage,
}: {
  children: React.ReactNode;
  user: DashboardShellUser;
  userId: string;
  userRole: string | null;
  tourCompleted: boolean;
  orgs: DashboardShellOrg[];
  portalMode: DashboardShellPortalMode;
  initialPlanUsage?: OrganizationUsageSummary | null;
}) {
  const { push } = useRouter();
  const pathname = usePathname();
  const tBreadcrumb = useTranslations("Breadcrumb");
  const [activeOrgId, setActiveOrgId] = React.useState<string | null>(() => {
    if (typeof window === "undefined" || portalMode === "admin") return null;
    try {
      return window.localStorage.getItem("active_org_id");
    } catch {
      return null;
    }
  });

  const rawSegments = (pathname ?? "")
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean);

  const dashboardIndex = rawSegments.indexOf("dashboard");
  const segments = dashboardIndex >= 0 ? rawSegments.slice(dashboardIndex + 1) : rawSegments;

  // `path` identifica al item (key estable); `href` sólo existe si el segmento es navegable.
  const breadcrumbItems: { label: string; path: string; href?: string }[] = [
    { label: tBreadcrumb("panel"), path: "/dashboard", href: "/dashboard" },
  ];

  if (segments.length === 0) {
    breadcrumbItems.push({ label: tBreadcrumb("dashboard"), path: "/dashboard#home" });
  }

  let hrefAcc = "/dashboard";
  for (const seg of segments) {
    hrefAcc += `/${seg}`;

    let label: string;
    if (seg === "new") label = tBreadcrumb("new");
    else if (seg === "create") label = tBreadcrumb("create");
    else if (seg === "edit") label = tBreadcrumb("edit");
    else if (isUuidLike(seg) || /^\d+$/.test(seg)) label = tBreadcrumb("details");
    else if (isKnownSegment(seg)) label = tBreadcrumb(seg);
    else label = seg;

    breadcrumbItems.push({
      label,
      path: hrefAcc,
      href: NON_ROUTABLE_SEGMENTS.has(seg) ? undefined : hrefAcc,
    });
  }

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
    /* c8 ignore next 3 */
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orgChanged', { detail: { orgId } }));
    }
  }, [portalMode]);

  // Reconcile a stale/absent active org against the orgs the user belongs to:
  // null on first load, or an id left over from a DB reseed / account switch.
  // Persists here (state owner) so client forms reading the raw active_org_id
  // cookie/localStorage scope to a real org instead of a phantom one.
  React.useEffect(() => {
    if (portalMode === "admin" || !orgs[0]) return;
    if (orgs.some((o) => String(o.id) === String(activeOrgId))) return;
    onChangeOrg(String(orgs[0].id));
  }, [activeOrgId, orgs, onChangeOrg, portalMode]);

  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    push("/auth/login");
  };

  return (
    <PlanUsageProvider initialSummary={initialPlanUsage}>
      <SidebarProvider>
        <DashboardTour userRole={userRole} userId={userId} tourCompleted={tourCompleted} />
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
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
            <div className="flex flex-1 items-center gap-2 px-4">
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
                      <React.Fragment key={item.path}>
                        <BreadcrumbItem className={idx === 0 ? "hidden md:block" : undefined}>
                          {isLast ? (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          ) : item.href ? (
                            <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                          ) : (
                            <span>{item.label}</span>
                          )}
                        </BreadcrumbItem>
                        {!isLast ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-1">
                <FeedbackDialog userEmail={user.email} userName={user.name} />
                <Link
                  href="/dashboard/notifications"
                  aria-label={tBreadcrumb("notifications")}
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Bell className="size-[18px]" />
                </Link>
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col px-4 pt-4">
            {children}
            <DashboardFooter />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PlanUsageProvider>
  );
}
