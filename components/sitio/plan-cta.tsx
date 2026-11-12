"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { selectPlan } from "@/components/sitio/select-plan";
import { cn } from "@/lib/utils";
import type { PlanType } from "@/types/plan";

export function PlanCta({ plan, className, children }: { plan: PlanType; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => selectPlan(plan, router.push)}
      className={cn(
        "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
    >
      {children}
      <ArrowRight className="size-5" strokeWidth={2.5} />
    </button>
  );
}
