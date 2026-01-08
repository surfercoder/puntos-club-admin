"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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
    const supabase = await createClient();

    // Validate input
    if (!input.beneficiary_id || !input.cashier_id || !input.branch_id) {
      return {
        success: false,
        error: "Missing required fields: beneficiary_id, cashier_id, or branch_id",
      };
    }

    if (!input.items || input.items.length === 0) {
      return {
        success: false,
        error: "At least one item is required",
      };
    }

    // Validate all items
    for (const item of input.items) {
      if (!item.item_name || item.quantity <= 0 || item.unit_price < 0) {
        return {
          success: false,
          error: "Invalid item data",
        };
      }
    }

    // Calculate total amount
    const total_amount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    // Get branch details to find organization_id
    const { data: branch, error: branchError } = await supabase
      .from("branch")
      .select("organization_id")
      .eq("id", input.branch_id)
      .single();

    if (branchError || !branch) {
      return {
        success: false,
        error: "Branch not found",
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
      console.error("Error calculating points:", pointsError);
      return {
        success: false,
        error: "Failed to calculate points",
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
      console.error("Error creating purchase:", purchaseError);
      return {
        success: false,
        error: "Failed to create purchase",
      };
    }

    // Create purchase items
    const purchaseItems = input.items.map((item) => ({
      purchase_id: purchase.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
      points_earned: Math.floor(
        (item.quantity * item.unit_price * points_earned) / total_amount
      ),
    }));

    const { error: itemsError } = await supabase
      .from("purchase_item")
      .insert(purchaseItems);

    if (itemsError) {
      console.error("Error creating purchase items:", itemsError);
      // Note: Purchase was created but items failed
      // You might want to implement a rollback mechanism here
      return {
        success: false,
        error: "Failed to create purchase items",
      };
    }

    // Get updated beneficiary balance
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from("beneficiary")
      .select("available_points")
      .eq("id", input.beneficiary_id)
      .single();

    if (beneficiaryError || !beneficiary) {
      console.error("Error fetching beneficiary:", beneficiaryError);
    }

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
        beneficiary_new_balance: beneficiary?.available_points || 0,
      },
    };
  } catch (error) {
    console.error("Unexpected error creating purchase:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
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
        branch:branch(name),
        purchase_item(*)
      `
      )
      .eq("beneficiary_id", beneficiary_id)
      .order("purchase_date", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching purchases:", error);
    return { success: false, error: "An unexpected error occurred" };
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
      console.error("Error fetching purchases:", error);
      return { success: false, error: error.message };
    }

    // Filter by organization - use active org ID if no filter provided
    const orgIdToFilter = filters?.organization_id ?? activeOrgIdNumber;
    let filteredData = data;
    if (orgIdToFilter && !Number.isNaN(orgIdToFilter)) {
      filteredData = data?.filter(
        (p: { branch?: { organization_id?: number } }) => p.branch?.organization_id === orgIdToFilter
      );
    }

    return { success: true, data: filteredData };
  } catch (error) {
    console.error("Unexpected error fetching purchases:", error);
    return { success: false, error: "An unexpected error occurred" };
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
        branch:branch(name, code, organization:organization(name)),
        purchase_item(*)
      `
      )
      .eq("id", purchase_id)
      .single();

    if (error) {
      console.error("Error fetching purchase:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching purchase:", error);
    return { success: false, error: "An unexpected error occurred" };
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
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("beneficiary")
      .select("id, first_name, last_name, email, available_points")
      .eq("email", authUser.user.email)
      .single();

    if (error || !data) {
      return { success: false, error: "Beneficiary not found" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error verifying beneficiary:", error);
    return { success: false, error: "An unexpected error occurred" };
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
      console.error("Error fetching points rules:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching points rules:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
