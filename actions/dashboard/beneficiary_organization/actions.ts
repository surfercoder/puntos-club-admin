"use server";

import { createClient } from '@/lib/supabase/server';
import { BeneficiaryOrganizationSchema } from '@/schemas/beneficiary_organization.schema';
import type { BeneficiaryOrganization } from '@/schemas/beneficiary_organization.schema';

export async function createBeneficiaryOrganization(input: BeneficiaryOrganization) {
  const parsed = BeneficiaryOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('beneficiary_organization')
    .insert([
      {
        beneficiary_id: parsed.data.beneficiary_id,
        organization_id: parsed.data.organization_id,
        available_points: parsed.data.available_points,
        total_points_earned: parsed.data.total_points_earned,
        total_points_redeemed: parsed.data.total_points_redeemed,
        is_active: parsed.data.is_active ?? true,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateBeneficiaryOrganization(id: string, input: BeneficiaryOrganization) {
  const parsed = BeneficiaryOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('beneficiary_organization')
    .update({
      beneficiary_id: parsed.data.beneficiary_id,
      organization_id: parsed.data.organization_id,
      available_points: parsed.data.available_points,
      total_points_earned: parsed.data.total_points_earned,
      total_points_redeemed: parsed.data.total_points_redeemed,
      is_active: parsed.data.is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteBeneficiaryOrganization(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('beneficiary_organization').delete().eq('id', id);

  return { error };
}

export async function getBeneficiaryOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('beneficiary_organization')
    .select(`
      *,
      beneficiary:beneficiary_id(id, first_name, last_name, email),
      organization:organization_id(id, name)
    `)
    .order('id', { ascending: false });

  return { data, error };
}

export async function getBeneficiaryOrganization(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('beneficiary_organization')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}
