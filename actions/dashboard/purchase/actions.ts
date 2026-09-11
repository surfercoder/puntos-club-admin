"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMutationOrgId } from "@/lib/auth/get-mutation-org-id";
import { requireUser } from "@/lib/auth/require-user";
import { hasOwnerPermissions, isAdmin } from "@/lib/auth/roles";
import { errorText, translateError } from '@/lib/error-handler';

export interface PurchaseItem {
  item_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreatePurchaseInput {
  beneficiary_id: number;
  cashier_id: number;
  branch_id: number;
  items: PurchaseItem[];
  notes?: string;
}

export interface PurchaseResponse {
  success: boolean;
  data?: {
    purchase_id: number;
    purchase_number: string;
    total_amount: number;
    points_earned: number;
    beneficiary_new_balance: number;
  };
  error?: string;
}

/**
 * Creates a new purchase with automatic points calculation
 */
export async function createPurchase(
  input: CreatePurchaseInput
): Promise<PurchaseResponse> {
  try {
    await requireUser();

    // Validate input
    if (!input.beneficiary_id || !input.cashier_id || !input.branch_id) {
      return {
        success: false,
        error: await errorText('purchase.fieldsRequired'),
      };
    }

    if (!input.items || input.items.length === 0) {
      return {
        success: false,
        error: await errorText('purchase.itemsRequired'),
      };
    }

    // Validate all items
    for (const item of input.items) {
      if (!item.item_name || item.quantity <= 0 || item.unit_price < 0) {
        return {
          success: false,
          error: await errorText('db.invalidValue'),
        };
      }
    }

    // Calculate total amount
    const total_amount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    const supabase = await createClient();

    // Get branch details to find organization_id
    const { data: branch, error: branchError } = await supabase
      .from("branch")
      .select("organization_id")
      .eq("id", input.branch_id)
      .single();

    if (branchError || !branch) {
      return {
        success: false,
        error: await errorText('branch.notFound'),
      };
    }

    // Calculate points using the database function
    const { data: pointsData, error: pointsError } = await supabase.rpc(
      "calculate_points_for_amount",
      {
        p_amount: total_amount,
        p_organization_id: branch.organization_id,
        p_branch_id: input.branch_id,
        p_category_id: null,
      }
    );

    if (pointsError) {
      return {
        success: false,
        error: await errorText('purchase.pointsFailed'),
      };
    }

    const points_earned = pointsData || 0;

    // Create the purchase (purchase_number will be auto-generated)
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchase")
      .insert({
        beneficiary_id: input.beneficiary_id,
        cashier_id: input.cashier_id,
        branch_id: input.branch_id,
        total_amount,
        points_earned,
        notes: input.notes,
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      return {
        success: false,
        error: await errorText('purchase.createFailed'),
      };
    }

    // Get updated beneficiary balance from beneficiary_organization (source of truth)
    const { data: beneficiaryOrg } = await supabase
      .from("beneficiary_organization")
      .select("available_points")
      .eq("beneficiary_id", input.beneficiary_id)
      .eq("organization_id", branch.organization_id)
      .single();

    // Revalidate relevant paths
    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/beneficiaries");

    return {
      success: true,
      data: {
        purchase_id: purchase.id,
        purchase_number: purchase.purchase_number,
        total_amount: parseFloat(purchase.total_amount),
        points_earned: purchase.points_earned,
        beneficiary_new_balance: beneficiaryOrg?.available_points || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: await translateError(error),
    };
  }
}

/**
 * Get purchase history for a beneficiary
 */
export async function getBeneficiaryPurchases(beneficiary_id: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("purchase")
      .select(
        `
        *,
        cashier:app_user!purchase_cashier_id_fkey(first_name, last_name),
        branch:branch(name)
      `
      )
      .eq("beneficiary_id", beneficiary_id)
      .order("purchase_date", { ascending: false });

    if (error) {
      return { success: false, error: await translateError(error) };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}

/**
 * Get all purchases (for admin/owner view)
 */
export async function getAllPurchases(filters?: {
  branch_id?: number;
  organization_id?: number;
  start_date?: string;
  end_date?: string;
}) {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser();
    const userIsAdmin = isAdmin(currentUser);

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get('active_org_id')?.value;
    const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

    let query = supabase
      .from("purchase")
      .select(
        `
        *,
        beneficiary:beneficiary(first_name, last_name, email),
        cashier:app_user!purchase_cashier_id_fkey(first_name, last_name),
        branch:branch(name, organization_id)
      `
      )
      .order("purchase_date", { ascending: false });

    if (filters?.branch_id) {
      query = query.eq("branch_id", filters.branch_id);
    }

    if (filters?.start_date) {
      query = query.gte("purchase_date", filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte("purchase_date", filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: await translateError(error) };
    }

    // Only filter by organization for non-admin users
    let filteredData = data;
    if (!userIsAdmin) {
      const orgIdToFilter = filters?.organization_id ?? activeOrgIdNumber;
      if (orgIdToFilter && !Number.isNaN(orgIdToFilter)) {
        filteredData = data?.filter(
          (p: { branch?: { organization_id?: number } }) => p.branch?.organization_id === orgIdToFilter
        );
      }
    }

    return { success: true, data: filteredData };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}

/**
 * Update an existing purchase (admin only)
 */
export async function updatePurchase(id: string, input: Record<string, unknown>) {
  try {
    await requireUser();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("purchase")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: await translateError(error) };
    }

    revalidatePath("/dashboard/purchase");
    return { success: true, data };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}

/**
 * Cancel a purchase (admin only). No la borra: queda como operacion cancelada
 * y el trigger de puntos devuelve los que habia asignado.
 */
export async function cancelPurchase(id: string, reason?: string) {
  try {
    const user = await requireUser();

    // Cancelar devuelve puntos: lo hace quien administra el club, no un cajero.
    if (!hasOwnerPermissions(user)) {
      return { success: false, error: await errorText('db.forbidden') };
    }

    const [supabase, orgId] = await Promise.all([createClient(), getMutationOrgId()]);

    if (!orgId) {
      return { success: false, error: await errorText('organization.noActive') };
    }

    const { data, error } = await supabase
      .from("purchase")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: Number(user.id),
        cancellation_reason: reason ?? null,
      })
      .eq("id", id)
      .eq("organization_id", orgId)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (error) {
      return { success: false, error: await translateError(error) };
    }
    if (!data) {
      return { success: false, error: await errorText('purchase.notCancellable') };
    }

    revalidatePath("/dashboard/purchase");
    return { success: true };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}

/**
 * Get purchase details by ID
 */
export async function getPurchaseById(purchase_id: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("purchase")
      .select(
        `
        *,
        beneficiary:beneficiary(first_name, last_name, email, phone),
        cashier:app_user!purchase_cashier_id_fkey(first_name, last_name, email),
        branch:branch(name, organization:organization(name))
      `
      )
      .eq("id", purchase_id)
      .single();

    if (error) {
      return { success: false, error: await translateError(error) };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}

/**
 * Verify beneficiary by user ID (from QR code)
 */
export async function verifyBeneficiary(_user_id: string) {
  try {
    const supabase = await createClient();

    // In a real implementation, you'd link the auth user_id to beneficiary
    // For now, we'll search by email
    const { data: authUser } = await supabase.auth.getUser();
    
    if (!authUser.user) {
      return { success: false, error: await errorText('auth.notAuthenticated') };
    }

    const { data, error } = await supabase
      .from("beneficiary")
      .select("id, first_name, last_name, email")
      .eq("email", authUser.user.email)
      .single();

    if (error || !data) {
      return { success: false, error: await errorText('beneficiary.notFound') };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}

/**
 * Get active points rules
 */
export async function getActivePointsRules() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("points_rule")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: await translateError(error) };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: await translateError(error) };
  }
}
