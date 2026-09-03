import type { Subscription } from '@/types/subscription';

// Extracted from SubscriptionForm to keep the component's own control-flow
// complexity down; behavior is unchanged.
export function resolveSubscriptionFormDefaults(subscription: Subscription | undefined) {
  return {
    organizationId: subscription?.organization_id ?? '',
    mpPreapprovalId: subscription?.mp_preapproval_id ?? '',
    mpPlanId: subscription?.mp_plan_id ?? '',
    plan: subscription?.plan ?? 'advance',
    status: subscription?.status ?? 'pending',
    payerEmail: subscription?.payer_email ?? '',
    amount: subscription?.amount ?? '',
    currency: subscription?.currency ?? 'ARS',
  };
}
