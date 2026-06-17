"use client";

import Link from 'next/link';
import { useActionState, useState, useEffect, useReducer } from 'react';
import { useTranslations } from 'next-intl';

import { subscriptionFormAction } from '@/actions/dashboard/subscription/subscription-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionSchema } from '@/schemas/subscription.schema';
import type { Subscription } from '@/types/subscription';

interface SubscriptionFormProps {
  subscription?: Subscription;
}

export default function SubscriptionForm({ subscription }: SubscriptionFormProps) {
  const t = useTranslations('Dashboard.subscription.form');
  const [validation, setValidation] = useState<ActionState | null>(null);
  type OrgRow = { id: string; name: string };
  const [organizations, setOrganizations] = useReducer((_: OrgRow[], next: OrgRow[]) => next, [] as OrgRow[]);

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data } = await supabase.from('organization').select('id, name').order('name');
      if (data) setOrganizations(data);
    }
    loadOrganizations();
  }, []);

  const [actionState, formAction, pending] = useActionState(subscriptionFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      SubscriptionSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {subscription?.id && <input name="id" type="hidden" value={subscription.id} />}

      <div>
        <Label htmlFor="organization_id">{t('organizationLabel')}</Label>
        <Select defaultValue={subscription?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder={t('selectOrganization')} />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="mp_preapproval_id">{t('mpPreapprovalIdLabel')}</Label>
        <Input defaultValue={subscription?.mp_preapproval_id ?? ''} id="mp_preapproval_id" name="mp_preapproval_id" placeholder="preapproval_..." type="text" />
        <FieldError actionState={validation ?? actionState} name="mp_preapproval_id" />
      </div>

      <div>
        <Label htmlFor="mp_plan_id">{t('mpPlanIdLabel')}</Label>
        <Input defaultValue={subscription?.mp_plan_id ?? ''} id="mp_plan_id" name="mp_plan_id" placeholder="plan_..." type="text" />
        <FieldError actionState={validation ?? actionState} name="mp_plan_id" />
      </div>

      <div>
        <Label htmlFor="plan">{t('planLabel')}</Label>
        <Select defaultValue={subscription?.plan ?? 'advance'} name="plan">
          <SelectTrigger>
            <SelectValue placeholder={t('selectPlan')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="advance">{t('advance')}</SelectItem>
            <SelectItem value="pro">{t('pro')}</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="plan" />
      </div>

      <div>
        <Label htmlFor="status">{t('statusLabel')}</Label>
        <Select defaultValue={subscription?.status ?? 'pending'} name="status">
          <SelectTrigger>
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t('statusPending')}</SelectItem>
            <SelectItem value="authorized">{t('statusAuthorized')}</SelectItem>
            <SelectItem value="paused">{t('statusPaused')}</SelectItem>
            <SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="status" />
      </div>

      <div>
        <Label htmlFor="payer_email">{t('payerEmailLabel')}</Label>
        <Input defaultValue={subscription?.payer_email ?? ''} id="payer_email" name="payer_email" placeholder="email@example.com" type="email" />
        <FieldError actionState={validation ?? actionState} name="payer_email" />
      </div>

      <div>
        <Label htmlFor="amount">{t('amountLabel')}</Label>
        <Input defaultValue={subscription?.amount ?? ''} id="amount" name="amount" placeholder="0.00" type="number" step="0.01" />
        <FieldError actionState={validation ?? actionState} name="amount" />
      </div>

      <div>
        <Label htmlFor="currency">{t('currencyLabel')}</Label>
        <Input defaultValue={subscription?.currency ?? 'ARS'} id="currency" name="currency" placeholder="ARS" type="text" />
        <FieldError actionState={validation ?? actionState} name="currency" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/subscription">{t('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {subscription ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}
