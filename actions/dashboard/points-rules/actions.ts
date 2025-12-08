"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PointsRuleInput {
  name: string;
  description?: string;
  rule_type: 'fixed_amount' | 'percentage' | 'fixed_per_item' | 'tiered';
  config: any; // JSON config based on rule_type
  is_active?: boolean;
  priority?: number;
  organization_id?: number;
  branch_id?: number;
  category_id?: number;
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

    const { data, error } = await supabase
      .from("points_rule")
      .select(`
        *,
        organization:organization(name),
        branch:branch(name),
        category:category(name)
      `)
      .order("priority", { ascending: false })
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
      .order("priority", { ascending: false });

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

    // Validate required fields
    if (!input.name || !input.rule_type || !input.config) {
      return {
        success: false,
        error: "Missing required fields: name, rule_type, or config",
      };
    }

    const { data, error } = await supabase
      .from("points_rule")
      .insert({
        name: input.name,
        description: input.description,
        rule_type: input.rule_type,
        config: input.config,
        is_active: input.is_active ?? true,
        priority: input.priority ?? 0,
        organization_id: input.organization_id,
        branch_id: input.branch_id,
        category_id: input.category_id,
        valid_from: input.valid_from,
        valid_until: input.valid_until,
        days_of_week: input.days_of_week,
        time_start: input.time_start,
        time_end: input.time_end,
        display_name: input.display_name,
        display_icon: input.display_icon,
        display_color: input.display_color,
        show_in_app: input.show_in_app ?? true,
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

    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.rule_type !== undefined) updateData.rule_type = input.rule_type;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.organization_id !== undefined) updateData.organization_id = input.organization_id;
    if (input.branch_id !== undefined) updateData.branch_id = input.branch_id;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;
    if (input.valid_from !== undefined) updateData.valid_from = input.valid_from;
    if (input.valid_until !== undefined) updateData.valid_until = input.valid_until;
    if (input.days_of_week !== undefined) updateData.days_of_week = input.days_of_week;
    if (input.time_start !== undefined) updateData.time_start = input.time_start;
    if (input.time_end !== undefined) updateData.time_end = input.time_end;
    if (input.display_name !== undefined) updateData.display_name = input.display_name;
    if (input.display_icon !== undefined) updateData.display_icon = input.display_icon;
    if (input.display_color !== undefined) updateData.display_color = input.display_color;
    if (input.show_in_app !== undefined) updateData.show_in_app = input.show_in_app;

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

    const { data, error } = await supabase.rpc("calculate_points_for_amount", {
      p_amount: amount,
      p_organization_id: organizationId || null,
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
