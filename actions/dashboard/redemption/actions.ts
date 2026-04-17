"use server";

import { createClient } from '@/lib/supabase/server';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

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
  const { data, error } = await supabase.from('redemption').insert([parsed.data]).select().single();

  if (error) {
    return { data, error };
  }

  // Deduct points from beneficiary_organization
  if (parsed.data.organization_id && parsed.data.points_used > 0) {
    const orgId = Number(parsed.data.organization_id);
    const beneficiaryId = Number(parsed.data.beneficiary_id);

    if (!Number.isNaN(orgId) && !Number.isNaN(beneficiaryId)) {
      const { data: membership } = await supabase
        .from('beneficiary_organization')
        .select('available_points, total_points_redeemed')
        .eq('organization_id', orgId)
        .eq('beneficiary_id', beneficiaryId)
        .single();

      if (membership) {
        await supabase
          .from('beneficiary_organization')
          .update({
            available_points: (membership.available_points ?? 0) - parsed.data.points_used,
            total_points_redeemed: (membership.total_points_redeemed ?? 0) + parsed.data.points_used,
          })
          .eq('organization_id', orgId)
          .eq('beneficiary_id', beneficiaryId);
      }
    }
  }

  return { data, error };
}

export async function updateRedemption(id: string, input: Redemption) {
  const parsed = RedemptionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('redemption').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteRedemption(id: string) {
  const supabase = await createClient();
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
