"use server";

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';

/**
 * Links an existing beneficiary to the current user's organization
 * This is useful for beneficiaries created before the automatic linking was implemented
 */
export async function linkBeneficiaryToOrganization(beneficiaryId: string) {
  const supabase = await createClient();
  
  // Get the current user to determine which organization to link to
  const currentUser = await getCurrentUser();
  
  if (!currentUser?.organization_id) {
    return { 
      data: null, 
      error: { message: 'No organization found for current user' } 
    };
  }

  // Check if the beneficiary exists
  const { data: beneficiary, error: beneficiaryError } = await supabase
    .from('beneficiary')
    .select('id, first_name, last_name, email')
    .eq('id', beneficiaryId)
    .single();

  if (beneficiaryError || !beneficiary) {
    return { 
      data: null, 
      error: { message: 'Beneficiary not found' } 
    };
  }

  // Check if the relationship already exists
  const { data: existing } = await supabase
    .from('beneficiary_organization')
    .select('id, is_active')
    .eq('beneficiary_id', beneficiaryId)
    .eq('organization_id', currentUser.organization_id)
    .single();

  if (existing) {
    // If relationship exists but is inactive, reactivate it
    if (!existing.is_active) {
      const { data, error } = await supabase
        .from('beneficiary_organization')
        .update({ is_active: true })
        .eq('id', existing.id)
        .select()
        .single();

      return { data, error };
    }
    
    // Already linked and active
    return { 
      data: existing, 
      error: null 
    };
  }

  // Create the beneficiary_organization relationship
  const { data, error: supabaseError } = await supabase
    .from('beneficiary_organization')
    .insert({
      beneficiary_id: beneficiaryId,
      organization_id: currentUser.organization_id,
      available_points: 0,
      total_points_earned: 0,
      total_points_redeemed: 0,
      is_active: true,
    })
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

/**
 * Links all unlinked beneficiaries to the current user's organization
 * This is a bulk operation for fixing existing data
 */
export async function linkAllUnlinkedBeneficiaries() {
  const supabase = await createClient();
  
  // Get the current user to determine which organization to link to
  const currentUser = await getCurrentUser();
  
  if (!currentUser?.organization_id) {
    return { 
      data: null, 
      error: { message: 'No organization found for current user' } 
    };
  }

  const BATCH_SIZE = 1000;
  const existingBeneficiaryIds = new Set<number>();
  const allBeneficiaries: Array<{ id: number }> = [];
  
  // Fetch existing relationships in batches
  let relationshipsOffset = 0;
  let hasMoreRelationships = true;
  
  while (hasMoreRelationships) {
    const { data: relationshipsBatch, error: relationshipsError } = await supabase
      .from('beneficiary_organization')
      .select('beneficiary_id')
      .eq('organization_id', currentUser.organization_id)
      .range(relationshipsOffset, relationshipsOffset + BATCH_SIZE - 1);

    if (relationshipsError) {
      return { 
        data: null, 
        error: { message: `Error fetching relationships: ${relationshipsError.message}` } 
      };
    }

    if (relationshipsBatch && relationshipsBatch.length > 0) {
      relationshipsBatch.forEach(r => existingBeneficiaryIds.add(r.beneficiary_id));
      relationshipsOffset += BATCH_SIZE;
      hasMoreRelationships = relationshipsBatch.length === BATCH_SIZE;
    } else {
      hasMoreRelationships = false;
    }
  }

  // Fetch all beneficiaries in batches
  let beneficiariesOffset = 0;
  let hasMoreBeneficiaries = true;
  
  while (hasMoreBeneficiaries) {
    const { data: beneficiariesBatch, error: beneficiariesError } = await supabase
      .from('beneficiary')
      .select('id')
      .range(beneficiariesOffset, beneficiariesOffset + BATCH_SIZE - 1);

    if (beneficiariesError) {
      return { 
        data: null, 
        error: { message: `Error fetching beneficiaries: ${beneficiariesError.message}` } 
      };
    }

    if (beneficiariesBatch && beneficiariesBatch.length > 0) {
      allBeneficiaries.push(...beneficiariesBatch);
      beneficiariesOffset += BATCH_SIZE;
      hasMoreBeneficiaries = beneficiariesBatch.length === BATCH_SIZE;
    } else {
      hasMoreBeneficiaries = false;
    }
  }

  // Filter out beneficiaries that are already linked
  const unlinkedBeneficiaries = allBeneficiaries.filter(
    b => !existingBeneficiaryIds.has(b.id)
  );

  if (unlinkedBeneficiaries.length === 0) {
    return { 
      data: { linked: 0, message: 'All beneficiaries are already linked' }, 
      error: null 
    };
  }

  // Create relationships for all unlinked beneficiaries
  const relationships = unlinkedBeneficiaries.map(b => ({
    beneficiary_id: b.id,
    organization_id: currentUser.organization_id,
    available_points: 0,
    total_points_earned: 0,
    total_points_redeemed: 0,
    is_active: true,
  }));

  const { data, error: supabaseError } = await supabase
    .from('beneficiary_organization')
    .insert(relationships)
    .select();

  // Normalize Supabase error to match project's custom error shape
  if (supabaseError) {
    return {
      data: null,
      error: {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint,
      },
    };
  }

  return { 
    data: { 
      linked: data?.length || 0, 
      message: `Successfully linked ${data?.length || 0} beneficiaries` 
    }, 
    error: null 
  };
}
