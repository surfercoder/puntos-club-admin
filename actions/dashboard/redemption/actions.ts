"use server";

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/require-user';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

// Maps Postgres exception messages raised by the redemption RPCs to a stable
// error code the UI can switch on. Anything we don't recognize falls back to
// the raw message so it still surfaces in toasts.
function mapRpcError(message: string | undefined | null): string {
  if (!message) return 'UNKNOWN_ERROR';
  const known = [
    'PENDING_REDEMPTION_EXISTS',
    'INSUFFICIENT_POINTS',
    'OUT_OF_STOCK',
    'MEMBERSHIP_NOT_FOUND',
    'MEMBERSHIP_INACTIVE',
    'PRODUCT_NOT_FOUND',
    'REDEMPTION_NOT_FOUND',
    'REDEMPTION_NOT_PENDING',
  ];
  const hit = known.find(code => message.includes(code));
  return hit ?? message;
}

export async function createRedemption(input: Redemption) {
  const parsed = RedemptionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = await createClient();

  const orgId = Number(parsed.data.organization_id);
  const beneficiaryId = Number(parsed.data.beneficiary_id);
  const productId = Number(parsed.data.product_id);

  if (Number.isNaN(orgId) || Number.isNaN(beneficiaryId) || Number.isNaN(productId)) {
    return { error: { message: 'INVALID_INPUT' } };
  }

  // Admin web flow: create the request and immediately deliver it so the admin
  // experience stays single-step. Cashier app uses the two-step flow.
  const { data: pending, error: requestError } = await supabase.rpc('request_redemption', {
    p_beneficiary_id: beneficiaryId,
    p_product_id: productId,
    p_organization_id: orgId,
  });

  if (requestError) {
    return { error: { message: mapRpcError(requestError.message) } };
  }

  const pendingId = (pending as { id: number } | null)?.id;
  if (!pendingId) {
    return { error: { message: 'UNKNOWN_ERROR' } };
  }

  const { data: delivered, error: deliverError } = await supabase.rpc('deliver_redemption', {
    p_redemption_id: pendingId,
  });

  if (deliverError) {
    return { error: { message: mapRpcError(deliverError.message) } };
  }

  return { data: delivered, error: null };
}

export async function deliverRedemption(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('deliver_redemption', {
    p_redemption_id: Number(id),
  });
  if (error) {
    return { error: { message: mapRpcError(error.message) } };
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
    return { error: { message: mapRpcError(error.message) } };
  }
  return { data, error: null };
}

export async function updateRedemption(id: string, input: Redemption) {
  // Editing redemption rows from the admin form is restricted now that the row
  // has a lifecycle. The form is only reachable for already-delivered rows and
  // existing usage just re-submits the same fields, so we no-op the mutation
  // rather than silently corrupt status/points/stock invariants.
  const parsed = RedemptionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from('redemption').select('*').eq('id', id).single();
  return { data, error };
}

export async function deleteRedemption(id: string) {
  await requireUser();
  const supabase = await createClient();
  // For pending rows route through cancel so the unique-pending index is freed
  // cleanly and the audit trail is preserved. For other statuses fall through
  // to a physical delete (legacy behavior).
  const { data: row } = await supabase.from('redemption').select('status').eq('id', id).single();
  if (row?.status === 'pending') {
    const { error } = await supabase.rpc('cancel_redemption', {
      p_redemption_id: Number(id),
      p_reason: 'Deleted from admin portal',
    });
    return { error: error ? { message: mapRpcError(error.message) } : null };
  }
  const { error } = await supabase.from('redemption').delete().eq('id', id);
  return { error };
}

export async function getRedemptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('redemption')
    .select(`
      *,
      beneficiary:beneficiary(first_name, last_name, email),
      product:product(name, organization_id)
    `)
    .order('redemption_date', { ascending: false });

  return { data, error };
}

export async function getRedemption(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('redemption').select('*').eq('id', id).single();

  return { data, error };
}
