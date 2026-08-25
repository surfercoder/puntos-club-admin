"use client";

import { MoreVertical, Pencil, Power } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { togglePointsRuleStatus } from "@/actions/dashboard/points-rules/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RuleRowActions({
  ruleId,
  isActive,
}: {
  ruleId: number;
  isActive: boolean;
}) {
  const t = useTranslations("PointsRules.rowActions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const result = await togglePointsRuleStatus(ruleId, !isActive);
      if (!result.success) {
        toast.error(t("toggleError"));
        return;
      }
      toast.success(isActive ? t("paused") : t("resumed"));
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={t("open")} disabled={pending}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/points-rules/edit/${ruleId}`}>
            <Pencil className="size-4" />
            {t("edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggle}>
          <Power className="size-4" />
          {isActive ? t("pause") : t("resume")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
