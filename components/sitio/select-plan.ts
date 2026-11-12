import { LS_PLAN } from "@/lib/onboarding-storage";
import type { PlanType } from "@/types/plan";

/** El paso 3 del onboarding lee LS_PLAN: el plan elegido acá llega preseleccionado. */
export function selectPlan(plan: PlanType, push: (href: string) => void) {
  try {
    localStorage.setItem(LS_PLAN, plan);
  } catch {
    // Sin storage el onboarding arranca en Trial, que es el default.
  }
  push("/owner/onboarding");
}
