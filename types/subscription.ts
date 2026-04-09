export type SubscriptionStatus = 'pending' | 'authorized' | 'paused' | 'cancelled';
export type SubscriptionPlan = 'advance' | 'pro';

export type Subscription = {
  id: string;
  organization_id: string;
  mp_preapproval_id: string;
  mp_plan_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  payer_email: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

