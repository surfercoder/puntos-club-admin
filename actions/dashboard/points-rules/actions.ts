"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isAdmin } from "@/lib/auth/roles";

export interface PointsRuleInput {
  name: string;
  description?: string;
  rule_type: 'fixed_amount' | 'percentage' | 'fixed_per_item' | 'tiered';
  config: Record<string, unknown>; // JSON config based on rule_type
  is_active?: boolean;
  organization_id?: number;
  branch_id?: number;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  is_default?: boolean;
  priority?: number;
  valid_from?: string;
  valid_until?: string;
  days_of_week?: number[];
  time_start?: string;
  time_end?: string;
  display_name?: string;
  display_icon?: string;
  display_color?: string;
  show_in_app?: boolean;
}

/**
 * Get all points rules
 */
export async function getAllPointsRules() {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser();
    const userIsAdmin = isAdmin(currentUser);

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;
    const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
    const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

    let query = supabase
      .from("points_rule")
      .select(`
        *,
        organization:organization(name),
        branch:branch(name),
        category:category(name)
      `)
      .order("created_at", { ascending: false });

    // Only filter by organization for non-admin users
    if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
      query = query.eq("organization_id", activeOrgIdNumber);
    }

    const { data, error } = await query;

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
      console.error("Error fetching active points rules:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching active points rules:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single points rule by ID
 */
export async function getPointsRuleById(id: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("points_rule")
      .select(`
        *,
        organization:organization(id, name),
        branch:branch(id, name),
        category:category(id, name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching points rule:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching points rule:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create a new points rule
 */
export async function createPointsRule(input: PointsRuleInput) {
  try {
    const supabase = await createClient();

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;
    const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
    const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

    // Validate required fields
    if (!input.name || !input.rule_type || !input.config) {
      return {
        success: false,
        error: "Missing required fields: name, rule_type, or config",
      };
    }

    // Validate organization_id
    if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
      return {
        success: false,
        error: "No active organization selected",
      };
    }

    // If branch_id is provided, validate it belongs to the organization
    if (input.branch_id) {
      const { data: branchData, error: branchError } = await supabase
        .from("branch")
        .select("id, organization_id")
        .eq("id", input.branch_id)
        .single();

      if (branchError || !branchData) {
        return { success: false, error: branchError?.message || "Invalid branch" };
      }

      if (Number(branchData.organization_id) !== activeOrgIdNumber) {
        return { success: false, error: "Branch does not belong to active organization" };
      }
    }

    const normalizedInput: PointsRuleInput = {
      ...input,
      organization_id: activeOrgIdNumber,
      ...(input.is_default
        ? {
            start_date: undefined,
            end_date: undefined,
            valid_from: undefined,
            valid_until: undefined,
            days_of_week: undefined,
            time_start: undefined,
            time_end: undefined,
          }
        : {}),
    };

    const { data, error } = await supabase
      .from("points_rule")
      .insert({
        name: normalizedInput.name,
        description: normalizedInput.description,
        rule_type: normalizedInput.rule_type,
        config: normalizedInput.config,
        is_active: normalizedInput.is_active ?? true,
        organization_id: normalizedInput.organization_id,
        branch_id: normalizedInput.branch_id,
        category_id: normalizedInput.category_id,
        start_date: normalizedInput.start_date,
        end_date: normalizedInput.end_date,
        is_default: normalizedInput.is_default ?? false,
        priority: normalizedInput.priority ?? 0,
        valid_from: normalizedInput.valid_from,
        valid_until: normalizedInput.valid_until,
        days_of_week: normalizedInput.days_of_week,
        time_start: normalizedInput.time_start,
        time_end: normalizedInput.time_end,
        display_name: normalizedInput.display_name,
        display_icon: normalizedInput.display_icon,
        display_color: normalizedInput.display_color,
        show_in_app: normalizedInput.show_in_app ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating points rule:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/points-rules");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error creating points rule:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing points rule
 */
export async function updatePointsRule(id: number, input: Partial<PointsRuleInput>) {
  try {
    const supabase = await createClient();

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;
    const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
    const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

    const updateData: Record<string, unknown> = {};

    // Validate organization_id
    if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
      return {
        success: false,
        error: "No active organization selected",
      };
    }

    const normalizedInput: Partial<PointsRuleInput> = {
      ...input,
      ...(input.is_default
        ? {
            start_date: undefined,
            end_date: undefined,
            valid_from: undefined,
            valid_until: undefined,
            days_of_week: undefined,
            time_start: undefined,
            time_end: undefined,
          }
        : {}),
    };

    // If branch_id is provided, validate it belongs to the organization
    if (normalizedInput.branch_id !== undefined && normalizedInput.branch_id !== null) {
      const { data: branchData, error: branchError } = await supabase
        .from("branch")
        .select("id, organization_id")
        .eq("id", normalizedInput.branch_id)
        .single();

      if (branchError || !branchData) {
        return { success: false, error: branchError?.message || "Invalid branch" };
      }

      if (Number(branchData.organization_id) !== activeOrgIdNumber) {
        return { success: false, error: "Branch does not belong to active organization" };
      }
    }
    
    if (normalizedInput.name !== undefined) updateData.name = normalizedInput.name;
    if (normalizedInput.description !== undefined) updateData.description = normalizedInput.description;
    if (normalizedInput.rule_type !== undefined) updateData.rule_type = normalizedInput.rule_type;
    if (normalizedInput.config !== undefined) updateData.config = normalizedInput.config;
    if (normalizedInput.is_active !== undefined) updateData.is_active = normalizedInput.is_active;
    updateData.organization_id = activeOrgIdNumber;
    if (normalizedInput.branch_id !== undefined) updateData.branch_id = normalizedInput.branch_id;
    if (normalizedInput.category_id !== undefined) updateData.category_id = normalizedInput.category_id;
    if (normalizedInput.start_date !== undefined) updateData.start_date = normalizedInput.start_date;
    if (normalizedInput.end_date !== undefined) updateData.end_date = normalizedInput.end_date;
    if (normalizedInput.is_default !== undefined) updateData.is_default = normalizedInput.is_default;
    if (normalizedInput.priority !== undefined) updateData.priority = normalizedInput.priority;
    if (normalizedInput.valid_from !== undefined) updateData.valid_from = normalizedInput.valid_from;
    if (normalizedInput.valid_until !== undefined) updateData.valid_until = normalizedInput.valid_until;
    if (normalizedInput.days_of_week !== undefined) updateData.days_of_week = normalizedInput.days_of_week;
    if (normalizedInput.time_start !== undefined) updateData.time_start = normalizedInput.time_start;
    if (normalizedInput.time_end !== undefined) updateData.time_end = normalizedInput.time_end;
    if (normalizedInput.display_name !== undefined) updateData.display_name = normalizedInput.display_name;
    if (normalizedInput.display_icon !== undefined) updateData.display_icon = normalizedInput.display_icon;
    if (normalizedInput.display_color !== undefined) updateData.display_color = normalizedInput.display_color;
    if (normalizedInput.show_in_app !== undefined) updateData.show_in_app = normalizedInput.show_in_app;

    const { data, error } = await supabase
      .from("points_rule")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating points rule:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/points-rules");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating points rule:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Toggle points rule active status
 */
export async function togglePointsRuleStatus(id: number, is_active: boolean) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("points_rule")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling points rule status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/points-rules");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error toggling points rule status:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a points rule
 */
export async function deletePointsRule(id: number) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("points_rule")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting points rule:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/points-rules");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting points rule:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get active offers for display in mobile apps
 */
export async function getActiveOffers(organizationId?: number, branchId?: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_active_offers", {
      p_organization_id: organizationId || null,
      p_branch_id: branchId || null,
      p_check_time: new Date().toISOString(),
    });

    if (error) {
      console.error("Error fetching active offers:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching active offers:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Test points calculation with a specific rule
 */
export async function testPointsCalculation(
  amount: number,
  organizationId?: number,
  branchId?: number,
  categoryId?: number
) {
  try {
    const supabase = await createClient();

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("active_org_id")?.value;
    const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
    const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

    const { data, error } = await supabase.rpc("calculate_points_for_amount", {
      p_amount: amount,
      p_organization_id: organizationId || activeOrgIdNumber || null,
      p_branch_id: branchId || null,
      p_category_id: categoryId || null,
      p_purchase_time: new Date().toISOString(),
    });

    if (error) {
      console.error("Error calculating points:", error);
      return { success: false, error: error.message };
    }

    return { success: true, points: data };
  } catch (error) {
    console.error("Unexpected error calculating points:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
