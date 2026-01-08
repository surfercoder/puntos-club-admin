"use server";

import { createClient } from '@/lib/supabase/server';
import { StockSchema } from '@/schemas/stock.schema';
import type { Stock } from '@/types/stock';

export async function createStock(input: Stock) {
  const parsed = StockSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('stock').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateStock(id: string, input: Stock) {
  const parsed = StockSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();

  // Verify the stock belongs to the user's organization
  const { data: stock, error: fetchError } = await supabase
    .from('stock')
    .select('branch:branch(organization_id)')
    .eq('id', id)
    .single();

  if (fetchError || !stock) {
    return { error: fetchError || { message: 'Stock not found' } };
  }

  // Get active organization from cookies
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  // Verify organization match
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    const stockBranch = stock.branch as unknown as { organization_id: number } | null;
    if (stockBranch?.organization_id !== activeOrgIdNumber) {
      return { error: { message: 'Unauthorized: Stock belongs to a different organization' } };
    }
  }

  const { data, error } = await supabase.from('stock').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteStock(id: string) {
  const supabase = await createClient();
  
  // First, verify the stock belongs to the user's organization
  const { data: stock, error: fetchError } = await supabase
    .from('stock')
    .select('branch:branch(organization_id)')
    .eq('id', id)
    .single();

  if (fetchError || !stock) {
    return { error: fetchError || new Error('Stock not found') };
  }

  // Get active organization from cookies
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  // Verify organization match
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    const stockBranch = stock.branch as unknown as { organization_id: number } | null;
    if (stockBranch?.organization_id !== activeOrgIdNumber) {
      return { error: new Error('Unauthorized: Stock belongs to a different organization') };
    }
  }

  const { error } = await supabase.from('stock').delete().eq('id', id);

  return { error };
}

export async function getStocks() {
  const supabase = await createClient();
  
  // Get active organization from cookies
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      branch:branch(name, organization_id),
      product:product(name)
    `)
    .order('last_updated', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  // Filter by organization through branch relationship
  const filteredData = activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)
    ? data?.filter((stock: { branch?: { organization_id?: number } }) => stock.branch?.organization_id === activeOrgIdNumber)
    : data;

  return { data: filteredData, error: null };
}

export async function getStock(id: string) {
  const supabase = await createClient();
  
  // Get active organization from cookies
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const { data, error } = await supabase
    .from('stock')
    .select('*, branch:branch(organization_id)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return { data: null, error: error || new Error('Stock not found') };
  }

  // Verify organization match
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    const stockBranch = data.branch as unknown as { organization_id: number } | null;
    if (stockBranch?.organization_id !== activeOrgIdNumber) {
      return { data: null, error: new Error('Unauthorized: Stock belongs to a different organization') };
    }
  }

  return { data, error: null };
}