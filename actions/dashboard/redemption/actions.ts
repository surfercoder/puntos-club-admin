"use server";

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { getMutationOrgId } from '@/lib/auth/get-mutation-org-id';

// Redemptions are only created by beneficiaries from the app / cashier flow —
// the admin portal deliberately has no create path so an owner cannot force a
// redemption on someone. Owners can only deliver, cancel or delete.
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

export async function deleteRedemption(id: string) {
  await requireUser();
  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { error: { message: 'Missing active organization' } };
  }

  // For pending rows route through cancel so the unique-pending index is freed
  // cleanly and the audit trail is preserved. For other statuses fall through
  // to a physical delete (legacy behavior).
  // Org-scoped: RLS lets any owner read cross-org, so this filter is the boundary.
  const { data: row, error: lookupError } = await supabase
    .from('redemption')
    .select('status')
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber)
    .maybeSingle();

  // maybeSingle so a transient DB error stays distinguishable from "no such row
  // in this org" — .single() collapses both into REDEMPTION_NOT_FOUND.
  if (lookupError) {
    return { error: { message: lookupError.message } };
  }
  if (!row) {
    return { error: { message: 'REDEMPTION_NOT_FOUND' } };
  }

  if (row.status === 'pending') {
    const { error } = await supabase.rpc('cancel_redemption', {
      p_redemption_id: Number(id),
      p_reason: 'Deleted from admin portal',
    });
    return { error: error ?? null };
  }

  const { error } = await supabase
    .from('redemption')
    .delete()
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber);
  return { error };
}
