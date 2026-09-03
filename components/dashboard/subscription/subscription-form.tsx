"use client";

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { subscriptionFormAction } from '@/actions/dashboard/subscription/subscription-form-actions';
import { FormCancelSubmitActions } from '@/components/dashboard/shared/form-cancel-submit-actions';
import { OrganizationSelectField } from '@/components/dashboard/shared/organization-select-field';
import { TextFormField } from '@/components/dashboard/shared/text-form-field';
import { useOrganizations } from '@/components/dashboard/shared/use-organizations';
import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { SubscriptionSchema } from '@/schemas/subscription.schema';
import type { Subscription } from '@/types/subscription';
import { resolveSubscriptionFormDefaults } from './subscription-form-defaults';

interface SubscriptionFormProps {
  subscription?: Subscription;
}

export default function SubscriptionForm({ subscription }: SubscriptionFormProps) {
  const t = useTranslations('Dashboard.subscription.form');
  const [validation, setValidation] = useState<ActionState | null>(null);
  const organizations = useOrganizations();
  const defaults = resolveSubscriptionFormDefaults(subscription);

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

      <OrganizationSelectField
        actionState={validation ?? actionState}
        defaultValue={defaults.organizationId}
        label={t('organizationLabel')}
        organizations={organizations}
        placeholder={t('selectOrganization')}
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.mpPreapprovalId}
        label={t('mpPreapprovalIdLabel')}
        name="mp_preapproval_id"
        placeholder="preapproval_..."
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.mpPlanId}
        label={t('mpPlanIdLabel')}
        name="mp_plan_id"
        placeholder="plan_..."
      />

      <div>
        <Label htmlFor="plan">{t('planLabel')}</Label>
        <Select defaultValue={defaults.plan} name="plan">
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
        <Select defaultValue={defaults.status} name="status">
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

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.payerEmail}
        label={t('payerEmailLabel')}
        name="payer_email"
        placeholder="email@example.com"
        type="email"
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.amount}
        label={t('amountLabel')}
        name="amount"
        placeholder="0.00"
        step="0.01"
        type="number"
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.currency}
        label={t('currencyLabel')}
        name="currency"
        placeholder="ARS"
      />

      <FormCancelSubmitActions
        cancelHref="/dashboard/subscription"
        cancelLabel={t('cancel')}
        createLabel={t('create')}
        isEditing={!!subscription}
        pending={pending}
        updateLabel={t('update')}
      />
    </form>
  );
}
