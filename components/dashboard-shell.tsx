"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardTour } from "@/components/dashboard/tour/dashboard-tour";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { LanguageSwitcher } from "@/components/language-switcher";
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
  const router = useRouter();
  const pathname = usePathname();
  const tBreadcrumb = useTranslations("Breadcrumb");
  const [activeOrgId, setActiveOrgId] = React.useState<string | null>(null);

  const breadcrumbItems = React.useMemo(() => {
    const knownSegments = [
      "address", "app_order", "app_user", "app_user_organization",
      "beneficiary", "beneficiary_organization", "branch", "category",
      "notifications", "organization", "organization_notification_limits",
      "points-rules", "product", "profile", "purchase", "push_notifications",
      "push_tokens", "redemption", "stock", "user-role", "users", "qr",
    ] as const;

    type KnownSegment = typeof knownSegments[number];

    const isKnownSegment = (s: string): s is KnownSegment =>
      (knownSegments as readonly string[]).includes(s);

    const isUuidLike = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const rawSegments = (pathname ?? "")
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .filter(Boolean);

    const dashboardIndex = rawSegments.indexOf("dashboard");
    const segments = dashboardIndex >= 0 ? rawSegments.slice(dashboardIndex + 1) : rawSegments;

    const items: { label: string; href?: string }[] = [
      { label: tBreadcrumb("panel"), href: "/dashboard" },
    ];

    let hrefAcc = "/dashboard";
    for (const seg of segments) {
      hrefAcc += `/${seg}`;

      let label: string;
      if (seg === "new") label = tBreadcrumb("new");
      else if (seg === "edit") label = tBreadcrumb("edit");
      else if (isUuidLike(seg) || /^\d+$/.test(seg)) label = tBreadcrumb("details");
      else if (isKnownSegment(seg)) label = tBreadcrumb(seg);
      else label = seg;

      items.push({ label, href: hrefAcc });
    }

    /* c8 ignore next */
    if (items.length > 0) items[items.length - 1] = { label: items[items.length - 1].label };

    return items;
  }, [pathname, tBreadcrumb]);

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
    /* c8 ignore next 3 */
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
                      <React.Fragment key={item.href ?? `last-${item.label}`}>
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
              <div className="ml-auto flex items-center gap-1">
                <FeedbackDialog userEmail={user.email} userName={user.name} />
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col px-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </PlanUsageProvider>
  );
}
