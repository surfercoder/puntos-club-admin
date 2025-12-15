"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
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

export function DashboardShell({
  children,
  user,
  orgs,
}: {
  children: React.ReactNode;
  user: DashboardShellUser;
  orgs: DashboardShellOrg[];
}) {
  const router = useRouter();
  const [activeOrgId, setActiveOrgId] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("active_org_id");
      if (stored) setActiveOrgId(stored);
    } catch {
      // ignore
    }
  }, []);

  const onChangeOrg = React.useCallback((orgId: string) => {
    setActiveOrgId(orgId);
    try {
      window.localStorage.setItem("active_org_id", orgId);
    } catch {
      // ignore
    }

    // For now we only persist selection. Later we can re-route to org-scoped URLs.
  }, []);

  const onLogout = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        orgs={orgs}
        activeOrgId={activeOrgId}
        onChangeOrg={onChangeOrg}
        onLogout={onLogout}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="text-sm text-muted-foreground">
              {orgs.find((o) => o.id === activeOrgId)?.name ?? orgs[0]?.name}
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
