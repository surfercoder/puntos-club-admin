"use server";

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { CategorySchema } from '@/schemas/category.schema';
import type { Category } from '@/types/category';

export async function createCategory(input: Category) {
  const parsed = CategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  const { data, error } = await supabase
    .from('category')
    .insert([
      {
        ...parsed.data,
        organization_id: activeOrgIdNumber,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function updateCategory(id: string, input: Category) {
  const parsed = CategorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'Missing active organization' } };
  }

  const { data, error } = await supabase
    .from('category')
    .update({
      ...parsed.data,
      organization_id: activeOrgIdNumber,
    })
    .eq('id', id)
    .eq('organization_id', activeOrgIdNumber)
    .select()
    .single();

  return { data, error };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

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

export async function getCategories() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  let query = supabase.from('category').select('*').order('name');
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function getCategory(id: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  let query = supabase.from('category').select('*').eq('id', id);
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query.single();

  return { data, error };
}
