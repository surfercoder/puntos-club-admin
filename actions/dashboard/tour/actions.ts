"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeTour(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_user")
    .update({ tour_completed: true })
    .eq("id", userId);

  return { error };
}
