"use server";

import { createClient } from '@/lib/supabase/server';
import { notifyRedemptionResolved } from '@/lib/notify-redemption';

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
  await notify(id);
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
  await notify(id);
  return { data, error: null };
}

// Best-effort: el canje ya cambio de estado en la base, un push caido no lo
// vuelve atras.
const notify = (id: string) =>
  notifyRedemptionResolved(Number(id)).catch(() => undefined);
