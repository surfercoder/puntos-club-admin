"use client";

import { useRouter } from "next/navigation";

import { PlanCards, type PlanLimitsByPlan } from "@/components/plan/plan-cards";
import { selectPlan } from "@/components/sitio/select-plan";

/** La tabla comparativa curada (mockup 3), la misma del onboarding y Ajustes. */
export function PlansTable({ limits }: { limits: PlanLimitsByPlan }) {
  const router = useRouter();
  return <PlanCards limits={limits} selected={null} onSelect={(plan) => selectPlan(plan, router.push)} />;
}
