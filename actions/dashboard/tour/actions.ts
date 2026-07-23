"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";

export async function completeTour(userId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_user")
    .update({ tour_completed: true })
    .eq("id", userId);

  return { error };
}
