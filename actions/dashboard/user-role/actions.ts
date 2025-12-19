"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get all user roles
 */
export async function getAllUserRoles() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_role")
      .select("*")
      .order("display_name");

    if (error) {
      console.error("Error fetching user roles:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching user roles:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single user role by ID
 */
export async function getUserRoleById(id: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_role")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching user role:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a user role (only display_name and description can be updated)
 */
export async function updateUserRole(
  id: number,
  input: { display_name?: string; description?: string }
) {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (input.display_name !== undefined) updateData.display_name = input.display_name;
    if (input.description !== undefined) updateData.description = input.description;

    const { data, error } = await supabase
      .from("user_role")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/user-role");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating user role:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get users count by role
 */
export async function getUsersCountByRole() {
  try {
    const supabase = await createClient();

    // Get app_user counts
    const { data: appUserCounts, error: appUserError } = await supabase
      .from("app_user")
      .select("role_id")
      .not("role_id", "is", null);

    if (appUserError) {
      console.error("Error fetching app user counts:", appUserError);
      return { success: false, error: appUserError.message };
    }

    // Get beneficiary counts (all beneficiaries have final_user role)
    const { count: beneficiaryCount, error: beneficiaryError } = await supabase
      .from("beneficiary")
      .select("*", { count: "exact", head: true });

    if (beneficiaryError) {
      console.error("Error fetching beneficiary count:", beneficiaryError);
      return { success: false, error: beneficiaryError.message };
    }

    // Count app users by role
    const roleCounts: Record<string, number> = {};
    appUserCounts?.forEach((user) => {
      const roleId = user.role_id?.toString();
      if (roleId) {
        roleCounts[roleId] = (roleCounts[roleId] || 0) + 1;
      }
    });

    return {
      success: true,
      data: {
        appUserCounts: roleCounts,
        beneficiaryCount: beneficiaryCount || 0,
      },
    };
  } catch (error) {
    console.error("Unexpected error fetching user counts:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

