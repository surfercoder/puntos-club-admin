"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreatePurchasableItemInput, UpdatePurchasableItemInput } from "@/types/purchasable_item";

/**
 * Get all purchasable items
 */
export async function getAllPurchasableItems() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("purchasable_item")
      .select(`
        *,
        category:category(id, name),
        points_rule:points_rule(id, name)
      `)
      .order("name");

    if (error) {
      console.error("Error fetching purchasable items:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching purchasable items:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get a single purchasable item by ID
 */
export async function getPurchasableItemById(id: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("purchasable_item")
      .select(`
        *,
        category:category(id, name),
        points_rule:points_rule(id, name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching purchasable item:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching purchasable item:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create a new purchasable item
 */
export async function createPurchasableItem(input: CreatePurchasableItemInput) {
  try {
    const supabase = await createClient();

    if (!input.name || input.default_price === undefined) {
      return {
        success: false,
        error: "Missing required fields: name or default_price",
      };
    }

    const { data, error } = await supabase
      .from("purchasable_item")
      .insert({
        name: input.name,
        description: input.description,
        category_id: input.category_id,
        default_price: input.default_price,
        points_rule_id: input.points_rule_id,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating purchasable item:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/purchasable-item");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error creating purchasable item:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing purchasable item
 */
export async function updatePurchasableItem(id: number, input: UpdatePurchasableItemInput) {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;
    if (input.default_price !== undefined) updateData.default_price = input.default_price;
    if (input.points_rule_id !== undefined) updateData.points_rule_id = input.points_rule_id;
    if (input.active !== undefined) updateData.active = input.active;

    const { data, error } = await supabase
      .from("purchasable_item")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchasable item:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/purchasable-item");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error updating purchasable item:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Toggle purchasable item active status
 */
export async function togglePurchasableItemStatus(id: number, active: boolean) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("purchasable_item")
      .update({ active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling purchasable item status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/purchasable-item");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error toggling purchasable item status:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a purchasable item
 */
export async function deletePurchasableItem(id: number) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("purchasable_item")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting purchasable item:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/purchasable-item");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting purchasable item:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
