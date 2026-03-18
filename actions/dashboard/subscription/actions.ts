"use server";

import { createClient } from '@/lib/supabase/server';
import { SubscriptionSchema } from '@/schemas/subscription.schema';
import type { Subscription } from '@/types/subscription';

export async function createSubscription(input: Subscription) {
  const parsed = SubscriptionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscription')
    .insert([parsed.data])
    .select()
    .single();

  return { data, error };
}

export async function updateSubscription(id: string, input: Subscription) {
  const parsed = SubscriptionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscription')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('subscription')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getSubscriptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscription')
    .select('*, organization:organization_id(name)')
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getSubscription(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscription')
    .select('*, organization:organization_id(name)')
    .eq('id', id)
    .single();

  return { data, error };
}
