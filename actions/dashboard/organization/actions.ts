"use server";

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { ClubProfileSchema, OrganizationSchema, OrganizationVisibilitySchema } from '@/schemas/organization.schema';
import type { Organization } from '@/types/organization';
import { hasOwnerPermissions, isAdmin } from '@/lib/auth/roles';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { requireUser } from '@/lib/auth/require-user';

export async function createOrganization(input: Organization) {
  await requireUser();
  const parsed = OrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').insert([parsed.data]).select().single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create organization');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    await supabase.from('organization').delete().eq('id', data.id);
    throw new Error('Not authenticated');
  }

  const { data: appUserRow, error: appUserError } = await supabase
    .from('app_user')
    .select('id, role:role_id(name)')
    .eq('auth_user_id', user.id)
    .single();

  if (appUserError || !appUserRow?.id) {
    await supabase.from('organization').delete().eq('id', data.id);
    throw new Error('Could not resolve app user for current session');
  }

  const currentUser = await getCurrentUser();
  
  // Only create app_user_organization association for non-admin users
  // Admins create organizations but don't belong to them
  // Owners should be associated with their organizations
  if (currentUser && !isAdmin(currentUser)) {
    const appUserId = Number(appUserRow.id);
    const orgId = Number((data as { id: unknown }).id);

    const { error: membershipError } = await supabase
      .from('app_user_organization')
      .insert({
        app_user_id: appUserId,
        organization_id: orgId,
        is_active: true,
      });

    if (membershipError) {
      await supabase.from('organization').delete().eq('id', data.id);
      throw new Error(membershipError.message || 'Failed to associate user to organization');
    }
  }

  return { data, error: null };
}

export async function updateOrganization(id: string, input: Organization) {
  await requireUser();
  const parsed = OrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').update(parsed.data).eq('id', id).select().single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update organization');
  }

  return { data, error: null };
}

export async function deleteOrganization(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from('organization').delete().eq('id', id);

  return { error };
}

export async function getOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').select('*').order('name');

  return { data, error };
}

export async function getOrganization(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').select('*').eq('id', id).single();

  return { data, error };
}

export async function getOrganizationSettings(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization')
    .select(
      'id, name, business_name, tax_id, logo_url, is_public, timezone, description, contact_email, contact_phone, website, industry, invitation_code, welcome_message, points_label, allow_new_members, requires_approval, email_notifications, show_in_explore',
    )
    .eq('id', id)
    .single();

  return { data, error };
}

/** Dirección principal de la organización (la primera que creó el onboarding). */
export async function getOrganizationAddress(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('address')
    .select('id, street, number, city, state, zip_code, country, place_id, latitude, longitude')
    .eq('organization_id', organizationId)
    .order('id')
    .limit(1)
    .maybeSingle();

  return { data, error };
}

export async function updateOrganizationVisibility(id: string, isPublic: boolean) {
  await requireUser();
  const parsed = OrganizationVisibilitySchema.safeParse({ is_public: isPublic });

  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  if (!isAdmin(currentUser)) {
    const { data: membership } = await supabase
      .from('app_user_organization')
      .select('id')
      .eq('app_user_id', currentUser.id)
      .eq('organization_id', id)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return { error: 'Forbidden' };
    }
  }

  const { data, error } = await supabase
    .from('organization')
    .update({ is_public: parsed.data.is_public })
    .eq('id', id)
    .select('id, name, is_public')
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, error: null };
}

export async function getOrganizationProducts(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product')
    .select(`
      *,
      category:category_id(id, name)
    `)
    .eq('organization_id', organizationId)
    .order('required_points', { ascending: true });

  return { data, error };
}

/** Campos del "Perfil del Club" que el owner puede editar desde el panel. */
export type ClubProfileAddress = {
  street: string;
  number: string;
  city: string;
  state: string;
  zip_code: string;
  country: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ClubProfileInput = {
  name: string;
  business_name: string | null;
  tax_id: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  is_public: boolean;
  show_in_explore: boolean;
  allow_new_members: boolean;
  requires_approval: boolean;
  email_notifications: boolean;
  invitation_code: string | null;
  welcome_message: string | null;
  points_label: string;
  timezone: string | null;
  /** Dirección principal; se crea si la organización todavía no tiene una. */
  address?: ClubProfileAddress;
};

export async function updateClubProfile(id: string, input: ClubProfileInput) {
  await requireUser();

  const currentUser = await getCurrentUser();
  if (!currentUser || !hasOwnerPermissions(currentUser)) {
    return { error: 'Not authorized' };
  }

  // El owner sólo puede tocar su propia organización.
  if (String(currentUser.organization_id) !== String(id)) {
    return { error: 'Not authorized' };
  }

  // El tipo no existe en runtime: se valida para no escribir campos que el
  // formulario no ofrece (plan, trial_started_at, ...).
  const parsed = ClubProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid club profile' };
  }
  const { address, ...orgFields } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from('organization')
    .update({
      ...orgFields,
      invitation_code: orgFields.invitation_code?.trim() || null,
    })
    .eq('id', id);

  if (error) {
    // organization_name_unique: el nombre es la identidad visible del club.
    if (error.code === '23505') {
      return { error: 'Ya existe una empresa con ese nombre. Probá con otro.' };
    }
    return { error: error.message };
  }

  if (address) {
    const { data: existing } = await supabase
      .from('address')
      .select('id')
      .eq('organization_id', id)
      .order('id')
      .limit(1)
      .maybeSingle();

    const { error: addressError } = existing
      ? await supabase.from('address').update(address).eq('id', existing.id)
      : await supabase.from('address').insert({ ...address, organization_id: Number(id) });

    if (addressError) {
      return { error: addressError.message };
    }
  }

  revalidatePath('/dashboard/settings/organization');
  return { error: null };
}
