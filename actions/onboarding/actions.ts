'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface OnboardingOrgInput {
  name: string;
  business_name?: string;
  tax_id?: string;
  logo_url?: string;
}

export interface OnboardingAddressInput {
  street: string;
  number: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  /** Display-only, not persisted to DB */
  formatted_address?: string;
}

export interface OnboardingBranchInput {
  name: string;
  phone?: string;
}

export interface OnboardingCashierInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface OnboardingProductInput {
  name: string;
  description?: string;
  required_points: number;
  quantity: number;
  minimum_quantity?: number;
}

export interface OnboardingCategoryInput {
  name: string;
  description?: string;
  products: OnboardingProductInput[];
}

// ─── Collected step data (passed through wizard state) ───────────────────────

export interface OnboardingStep2Data {
  org: OnboardingOrgInput;
  address: OnboardingAddressInput;
  branch: OnboardingBranchInput;
  cashier?: OnboardingCashierInput;
}

export interface OnboardingStep4Data {
  categories: OnboardingCategoryInput[];
}

// ─── Atomic onboarding action ─────────────────────────────────────────────────

/**
 * Creates all onboarding entities in a single operation.
 * Called at step 5 after all data has been collected across steps 2–4.
 *
 * If the authenticated user already has an org linked, returns existing
 * data without duplicate writes (idempotent).
 */
export async function completeOnboarding(input: {
  step2: OnboardingStep2Data;
  plan?: string;
  mpPreapprovalId?: string;
  step4?: OnboardingStep4Data | null;
}): Promise<{
  success: boolean;
  data?: { organizationId: number; branchId: number; orgName: string };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No autenticado. Por favor inicia sesión nuevamente.' };
    }

    // ── Idempotency: return existing data if step 2 was already completed ──
    const { data: existingAppUser } = await supabase
      .from('app_user')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingAppUser?.organization_id) {
      const { data: org } = await supabase
        .from('organization')
        .select('name')
        .eq('id', existingAppUser.organization_id)
        .single();

      const { data: branch } = await supabase
        .from('branch')
        .select('id')
        .eq('organization_id', existingAppUser.organization_id)
        .limit(1)
        .maybeSingle();

      return {
        success: true,
        data: {
          organizationId: Number(existingAppUser.organization_id),
          branchId: branch ? Number(branch.id) : 0,
          orgName: org?.name ?? input.step2.org.name,
        },
      };
    }

    const plan = input.plan ?? 'trial';

    // ── 1. Create organization ────────────────────────────────────────────────
    const { data: orgData, error: orgError } = await adminClient
      .from('organization')
      .insert({
        name: input.step2.org.name,
        business_name: input.step2.org.business_name || null,
        tax_id: input.step2.org.tax_id || null,
        logo_url: input.step2.org.logo_url || null,
        plan,
        trial_started_at: plan === 'trial' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (orgError || !orgData) {
      return { success: false, error: orgError?.message || 'Error al crear la organización.' };
    }

    const organizationId = Number(orgData.id);

    // ── 2. Create address ─────────────────────────────────────────────────────
    const { data: addressData, error: addressError } = await adminClient
      .from('address')
      .insert({
        street: input.step2.address.street,
        number: input.step2.address.number,
        city: input.step2.address.city,
        state: input.step2.address.state,
        zip_code: input.step2.address.zip_code,
        country: input.step2.address.country || null,
        place_id: input.step2.address.place_id || null,
        latitude: input.step2.address.latitude ?? null,
        longitude: input.step2.address.longitude ?? null,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (addressError || !addressData) {
      await adminClient.from('organization').delete().eq('id', organizationId);
      return { success: false, error: addressError?.message || 'Error al crear la dirección.' };
    }

    // ── 3. Create branch ──────────────────────────────────────────────────────
    const { data: branchData, error: branchError } = await adminClient
      .from('branch')
      .insert({
        name: input.step2.branch.name || input.step2.org.name,
        phone: input.step2.branch.phone || null,
        organization_id: organizationId,
        address_id: Number(addressData.id),
        active: true,
      })
      .select()
      .single();

    if (branchError || !branchData) {
      await adminClient.from('address').delete().eq('id', addressData.id);
      await adminClient.from('organization').delete().eq('id', organizationId);
      return { success: false, error: branchError?.message || 'Error al crear la sucursal.' };
    }

    const branchId = Number(branchData.id);

    // ── 4. Resolve owner role (create it if missing, e.g. on a fresh dev DB) ──
    let { data: roleData } = await adminClient
      .from('user_role')
      .select('id')
      .eq('name', 'owner')
      .maybeSingle();

    if (!roleData) {
      const { data: inserted, error: insertRoleError } = await adminClient
        .from('user_role')
        .insert({ name: 'owner', display_name: 'Propietario' })
        .select('id')
        .single();

      if (insertRoleError || !inserted) {
        await adminClient.from('branch').delete().eq('id', branchId);
        await adminClient.from('address').delete().eq('id', addressData.id);
        await adminClient.from('organization').delete().eq('id', organizationId);
        return { success: false, error: 'Error al obtener o crear el rol de propietario.' };
      }
      roleData = inserted;
    }

    // ── 5. Create app_user ────────────────────────────────────────────────────
    const metadata = user.user_metadata || {};
    let appUserId: number;

    if (existingAppUser) {
      const { data: updatedUser, error: updateError } = await adminClient
        .from('app_user')
        .update({ organization_id: organizationId, role_id: roleData.id, active: true })
        .eq('id', existingAppUser.id)
        .select()
        .single();

      if (updateError || !updatedUser) {
        await adminClient.from('branch').delete().eq('id', branchId);
        await adminClient.from('address').delete().eq('id', addressData.id);
        await adminClient.from('organization').delete().eq('id', organizationId);
        return { success: false, error: updateError?.message || 'Error al actualizar el perfil.' };
      }
      appUserId = Number(updatedUser.id);
    } else {
      const { data: appUserData, error: appUserError } = await adminClient
        .from('app_user')
        .insert({
          email: user.email,
          first_name: metadata.first_name || null,
          last_name: metadata.last_name || null,
          organization_id: organizationId,
          role_id: roleData.id,
          auth_user_id: user.id,
          active: true,
        })
        .select()
        .single();

      if (appUserError || !appUserData) {
        await adminClient.from('branch').delete().eq('id', branchId);
        await adminClient.from('address').delete().eq('id', addressData.id);
        await adminClient.from('organization').delete().eq('id', organizationId);
        return { success: false, error: appUserError?.message || 'Error al crear el perfil de usuario.' };
      }
      appUserId = Number(appUserData.id);
    }

    // ── 6. Create app_user_organization association ───────────────────────────
    await adminClient.from('app_user_organization').upsert(
      { app_user_id: appUserId, organization_id: organizationId, is_active: true },
      { onConflict: 'app_user_id,organization_id' }
    );

    // ── 7. Create default points rule ─────────────────────────────────────────
    await adminClient.from('points_rule').insert({
      name: 'Regla de puntos base',
      description: 'Por cada $1 de compra, el cliente gana 1 punto',
      rule_type: 'fixed_amount',
      config: { points_per_dollar: 1 },
      is_active: true,
      is_default: true,
      organization_id: organizationId,
      branch_id: branchId,
      priority: 0,
      display_name: '1 punto por $1',
      display_icon: '⭐',
      display_color: '#059669',
      show_in_app: true,
    });

    // ── 8. Create subscription record for paid plans ─────────────────────────
    if (input.mpPreapprovalId && (plan === 'advance' || plan === 'pro')) {
      const PLAN_AMOUNTS: Record<string, number> = { advance: 50, pro: 89 };
      await adminClient.from('subscription').upsert(
        {
          organization_id: organizationId,
          mp_preapproval_id: input.mpPreapprovalId,
          mp_plan_id: plan, // Subscription uses "without plan" flow; plan is our internal id
          plan,
          status: 'pending',
          payer_email: user.email /* c8 ignore next */ ?? '',
          amount: PLAN_AMOUNTS[plan] /* c8 ignore next */ ?? 0,
          currency: 'ARS',
        },
        { onConflict: 'mp_preapproval_id' }
      );
    }

    // ── 9. Create catalog (optional) ──────────────────────────────────────────
    if (input.step4?.categories?.length) {
      for (const cat of input.step4.categories) {
        if (!cat.name.trim()) continue;

        const { data: categoryData, error: categoryError } = await adminClient
          .from('category')
          .insert({
            name: cat.name.trim(),
            description: cat.description || null,
            organization_id: organizationId,
            active: true,
          })
          .select()
          .single();

        if (categoryError || !categoryData) continue;

        for (const prod of cat.products) {
          if (!prod.name.trim()) continue;

          const { data: productData, error: productError } = await adminClient
            .from('product')
            .insert({
              name: prod.name.trim(),
              description: prod.description || null,
              required_points: prod.required_points || 100,
              category_id: Number(categoryData.id),
              organization_id: organizationId,
              active: true,
              creation_date: new Date().toISOString().split('T')[0],
            })
            .select()
            .single();

          if (productError || !productData) continue;

          await adminClient.from('stock').insert({
            product_id: Number(productData.id),
            branch_id: branchId,
            quantity: prod.quantity || 0,
            minimum_quantity: prod.minimum_quantity || 1,
          });
        }
      }
    }

    // ── 10. Create cashier user (optional) ───────────────────────────────────
    if (input.step2.cashier?.email && input.step2.cashier?.password) {
      const { cashier } = input.step2;

      const { data: cashierAuthData, error: cashierAuthError } =
        await adminClient.auth.admin.createUser({
          email: cashier.email,
          password: cashier.password,
          email_confirm: true,
          user_metadata: {
            first_name: cashier.first_name || null,
            last_name: cashier.last_name || null,
            role_name: 'cashier',
          },
        });

      if (!cashierAuthError && cashierAuthData?.user) {
        // Safety net: remove any beneficiary record the DB trigger may have
        // created for this email before the migration was applied.
        await adminClient
          .from('beneficiary')
          .delete()
          .eq('email', cashier.email);

        let { data: cashierRoleData } = await adminClient
          .from('user_role')
          .select('id')
          .eq('name', 'cashier')
          .maybeSingle();

        if (!cashierRoleData) {
          const { data: insertedRole } = await adminClient
            .from('user_role')
            .insert({ name: 'cashier', display_name: 'Cajero' })
            .select('id')
            .single();
          cashierRoleData = insertedRole;
        }

        if (cashierRoleData) {
          const { data: cashierAppUser } = await adminClient
            .from('app_user')
            .insert({
              email: cashier.email,
              first_name: cashier.first_name || null,
              last_name: cashier.last_name || null,
              organization_id: organizationId,
              role_id: cashierRoleData.id,
              auth_user_id: cashierAuthData.user.id,
              active: true,
            })
            .select()
            .single();

          if (cashierAppUser) {
            await adminClient.from('app_user_organization').upsert(
              {
                app_user_id: Number(cashierAppUser.id),
                organization_id: organizationId,
                is_active: true,
              },
              { onConflict: 'app_user_id,organization_id' }
            );
          }
        }
      }
    }

    return {
      success: true,
      data: { organizationId, branchId, orgName: orgData.name },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error inesperado. Por favor intenta de nuevo.',
    };
  }
}

/**
 * Get onboarding status for the current authenticated user.
 */
export async function getOnboardingStatus() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: true, status: 'unauthenticated' as const, data: null };
    }

    const { data: appUser } = await supabase
      .from('app_user')
      .select(
        `
        id,
        organization_id,
        organization:organization_id(id, name, logo_url),
        role:role_id(name)
      `
      )
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!appUser) {
      return {
        success: true,
        status: 'needs_profile' as const,
        data: {
          authUser: {
            id: user.id,
            email: user.email,
            firstName: user.user_metadata?.first_name,
            lastName: user.user_metadata?.last_name,
          },
        },
      };
    }

    const role = (Array.isArray(appUser.role) ? appUser.role[0] : appUser.role) as { name: string } | null;
    const org = Array.isArray(appUser.organization)
      ? appUser.organization[0]
      : appUser.organization;

    if (!appUser.organization_id) {
      return {
        success: true,
        status: 'needs_org' as const,
        data: { appUserId: appUser.id, authUser: { id: user.id, email: user.email } },
      };
    }

    const { data: branch } = await supabase
      .from('branch')
      .select('id')
      .eq('organization_id', appUser.organization_id)
      .limit(1)
      .maybeSingle();

    return {
      success: true,
      status: 'complete' as const,
      data: {
        appUserId: appUser.id,
        organizationId: appUser.organization_id,
        branchId: branch?.id /* c8 ignore next */ ?? null,
        role: role?.name,
        org,
      },
    };
  } catch (error) {
    return {
      success: false,
      status: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    };
  }
}
