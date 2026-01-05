"use server";

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/product';

export async function createProduct(input: Product) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
    return { data: null, error: { message: 'Missing active organization' } };
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

export async function updateProduct(id: string, input: Product) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
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
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
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
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  let query = supabase.from('product').select('*').order('name');
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
  }

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