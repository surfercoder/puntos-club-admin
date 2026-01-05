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
  const { data, error: supabaseError } = await supabase
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

  // Normalize Supabase error to match project's custom error shape
  if (supabaseError) {
    return {
      data,
      error: {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      },
    };
  }

  return { data, error: null };
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
  const { data, error: supabaseError } = await supabase
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

  // Normalize Supabase error to match project's custom error shape
  if (supabaseError) {
    return {
      data,
      error: {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      },
    };
  }

  return { data, error: null };
}

export async function deleteBeneficiaryOrganization(id: string) {
  const supabase = await createClient();
  const { error: supabaseError } = await supabase.from('beneficiary_organization').delete().eq('id', id);

  // Normalize Supabase error to match project's custom error shape
  if (supabaseError) {
    return {
      error: {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      },
    };
  }

  return { error: null };
}

export async function getBeneficiaryOrganizations() {
  const supabase = await createClient();
  const { data, error: supabaseError } = await supabase
    .from('beneficiary_organization')
    .select(`
      *,
      beneficiary:beneficiary_id(id, first_name, last_name, email),
      organization:organization_id(id, name)
    `)
    .order('id', { ascending: false });

  // Normalize Supabase error to match project's custom error shape
  if (supabaseError) {
    return {
      data,
      error: {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      },
    };
  }

  return { data, error: null };
}

export async function getBeneficiaryOrganization(id: string) {
  const supabase = await createClient();
  const { data, error: supabaseError } = await supabase
    .from('beneficiary_organization')
    .select('*')
    .eq('id', id)
    .single();

  // Normalize Supabase error to match project's custom error shape
  if (supabaseError) {
    return {
      data,
      error: {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      },
    };
  }

  return { data, error: null };
}
