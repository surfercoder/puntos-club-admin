"use server";

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getMutationOrgId } from '@/lib/auth/get-mutation-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { requireUser } from '@/lib/auth/require-user';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import { CategorySchema } from '@/schemas/category.schema';
import { enforcePlanLimit } from '@/lib/plans/usage';

// El ABM de categorías se eliminó: se crean sólo desde el alta de producto y
// desde el onboarding. La tabla y el tipo siguen existiendo.
export async function createCategory(input: Category) {
  await requireUser();
  const parsed = CategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { data: null, error: { fieldErrors } };
  }

  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  // Ya no hay ABM para borrar duplicados, así que reusamos la categoría existente
  // si el nombre ya está dado de alta en la organización. La comparación se hace
  // acá y no con ilike para no tratar % ni _ del nombre como comodines.
  const { data: existingRows } = await supabase
    .from('category')
    .select('*')
    .eq('organization_id', activeOrgIdNumber);

  const existing = (existingRows ?? []).find(
    (row: { name: string }) => row.name.trim().toLowerCase() === parsed.data.name.trim().toLowerCase()
  );

  if (existing) {
    return { data: existing, error: null, created: false };
  }

  const { data, error } = await supabase
    .from('category')
    .insert([{ ...parsed.data, organization_id: activeOrgIdNumber }])
    .select()
    .single();

  return { data, error, created: !error };
}

export async function deleteCategory(id: string) {
  await requireUser();
  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { error: { message: 'Missing active organization' } };
  }

  const { error } = await supabase
    .from('category')
    .delete()
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber);

  return { error };
}

export async function createProduct(input: Product) {
  await requireUser();

  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  const limitError = await enforcePlanLimit(activeOrgIdNumber, 'redeemable_products');
  if (limitError) {
    return { data: null, error: { message: limitError.message } };
  }

  const { data, error } = await supabase
    .from('product')
    .insert([
      {
        ...input,
        organization_id: activeOrgIdNumber,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateProduct(id: string, input: Partial<Product>) {
  await requireUser();

  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  const { data, error } = await supabase
    .from('product')
    .update({
      ...input,
      organization_id: activeOrgIdNumber,
    })
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber)
    .select()
    .single();

  return { data, error };
}

export async function deleteProduct(id: string) {
  await requireUser();

  const [supabase, activeOrgIdNumber] = await Promise.all([createClient(), getMutationOrgId()]);

  if (!activeOrgIdNumber) {
    return { error: { message: 'Missing active organization' } };
  }

  const { error } = await supabase
    .from('product')
    .delete()
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber);

  return { error };
}

export async function getProducts() {
  const [supabase, currentUser] = await Promise.all([createClient(), getCurrentUser()]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let query = supabase.from('product').select('*').order('name');
  if (orgIdFilter) {
    query = query.eq('organization_id', orgIdFilter);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  let query = supabase.from('product').select('*').eq('id', id);
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query.single();

  return { data, error };
}