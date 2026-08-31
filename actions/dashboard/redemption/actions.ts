"use server";

import { createClient } from '@/lib/supabase/server';

// Redemptions are only created by beneficiaries from the app / cashier flow —
// the admin portal deliberately has no create path so an owner cannot force a
// redemption on someone. Owners can only deliver or cancel: un canje nunca se borra.
export async function deliverRedemption(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('deliver_redemption', {
    p_redemption_id: Number(id),
  });
  if (error) {
    return { error };
  }
  return { data, error: null };
}

export async function cancelRedemption(id: string, reason?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('cancel_redemption', {
    p_redemption_id: Number(id),
    p_reason: reason ?? null,
  });
  if (error) {
    return { error };
  }
  return { data, error: null };
}
