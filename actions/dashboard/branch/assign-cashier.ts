"use server";

import { revalidatePath } from "next/cache";

import { getMutationOrgId } from "@/lib/auth/get-mutation-org-id";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Asigna (o libera) la sucursal de un cajero. Cada sucursal necesita un cajero
 * para poder operar desde la App Cajeros, así que la relación vive en app_user.
 */
/**
 * ¿La sucursal existe y es de la organización activa? El alta de cajero la
 * llama *antes* de crear nada: si la sucursal no sirve y el chequeo corriera
 * recién al asignar, quedaría un app_user (y su usuario de Auth) huérfano que
 * además deja el email tomado para el reintento.
 */
export async function checkBranchInActiveOrg(branchId: string) {
  await requireUser();
  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { error: { message: "Missing active organization" } };
  }

  const { data: branch, error: branchError } = await supabase
    .from("branch")
    .select("id")
    .eq("id", branchId)
    .eq("organization_id", activeOrgIdNumber)
    .maybeSingle();

  if (branchError) return { error: { message: branchError.message } };
  if (!branch) return { error: { message: "BRANCH_NOT_FOUND" } };
  return { error: null };
}

export async function assignCashierToBranch(cashierId: string, branchId: string | null) {
  await requireUser();

  if (branchId) {
    const check = await checkBranchInActiveOrg(branchId);
    if (check.error) return { error: check.error };
  }

  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { error: { message: "Missing active organization" } };
  }

  const { error } = await supabase
    .from("app_user")
    .update({ branch_id: branchId ? Number(branchId) : null })
    .eq("id", cashierId)
    .eq("organization_id", activeOrgIdNumber);

  if (error) return { error: { message: error.message } };

  revalidatePath("/dashboard/branch");
  revalidatePath("/dashboard/cashiers");
  return { error: null };
}
