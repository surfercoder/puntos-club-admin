"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type BellItem = {
  id: number;
  organization_id: number;
  body: string;
  read_at: string | null;
  organization: { name: string } | { name: string }[] | null;
};

/**
 * Campanita del header. Al owner le muestra los mensajes del superadmin; al
 * superadmin, las respuestas de las organizaciones. Se refresca al navegar: abrir
 * el hilo los marca leidos del lado del servidor.
 * ponytail: sin realtime (ver supabase-channel-topic-colision); sumarlo si
 * hace falta enterarse sin cambiar de pantalla.
 */
export function NotificationBell({
  isPlatform,
  activeOrgId,
}: {
  isPlatform: boolean;
  activeOrgId: string | null;
}) {
  const t = useTranslations("NotificationBell");
  const pathname = usePathname();
  const [items, setItems] = React.useState<BellItem[]>([]);
  const [unread, setUnread] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    // Lo que escribio "el otro lado" del hilo.
    let list = supabase
      .from("platform_message")
      .select("id, organization_id, body, read_at, organization:organization_id(name)")
      .eq("from_platform", !isPlatform)
      .order("created_at", { ascending: false })
      .limit(5);
    let count = supabase
      .from("platform_message")
      .select("id", { count: "exact", head: true })
      .eq("from_platform", !isPlatform)
      .is("read_at", null);
    if (!isPlatform && activeOrgId) {
      list = list.eq("organization_id", Number(activeOrgId));
      count = count.eq("organization_id", Number(activeOrgId));
    }

    Promise.all([list, count]).then(([listRes, countRes]) => {
      if (cancelled) return;
      setItems((listRes.data ?? []) as BellItem[]);
      setUnread(countRes.count ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [isPlatform, activeOrgId, pathname]);

  const hrefFor = (item: BellItem) =>
    isPlatform ? `/dashboard/messages?org=${item.organization_id}` : "/dashboard/messages";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={unread > 0 ? t("ariaUnread", { count: unread }) : t("aria")}
          className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          type="button"
        >
          <Bell className="size-[18px]" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{isPlatform ? t("adminTitle") : t("ownerTitle")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          items.map((item) => {
            const org = Array.isArray(item.organization) ? item.organization[0] : item.organization;
            return (
              <DropdownMenuItem asChild key={item.id}>
                <Link className="flex flex-col items-start gap-0.5" href={hrefFor(item)}>
                  <span className={cn("text-xs text-muted-foreground", !item.read_at && "font-semibold text-foreground")}>
                    {isPlatform ? org?.name : t("platformName")}
                  </span>
                  <span className="line-clamp-2 text-sm">{item.body}</span>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link className="justify-center font-medium" href="/dashboard/messages">
            {t("seeAll")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
