"use client";

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { planLimitFormAction } from '@/actions/dashboard/plan_limits/plan-limit-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { PlanLimitSchema } from '@/schemas/plan_limit.schema';
import type { PlanLimit } from '@/types/plan';

interface PlanLimitFormProps {
  planLimit?: PlanLimit;
}

export default function PlanLimitForm({ planLimit }: PlanLimitFormProps) {
  const t = useTranslations('Dashboard.planLimits.form');
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [actionState, formAction, pending] = useActionState(planLimitFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      PlanLimitSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {planLimit?.id && <input name="id" type="hidden" value={planLimit.id} />}

      <div>
        <Label htmlFor="plan">{t('planLabel')}</Label>
        <Select defaultValue={planLimit?.plan ?? 'trial'} name="plan">
          <SelectTrigger><SelectValue placeholder={t('selectPlan')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="trial">{t('trial')}</SelectItem>
            <SelectItem value="advance">{t('advance')}</SelectItem>
            <SelectItem value="pro">{t('pro')}</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="plan" />
      </div>

      <div>
        <Label htmlFor="feature">{t('featureLabel')}</Label>
        <Select defaultValue={planLimit?.feature ?? ''} name="feature">
          <SelectTrigger><SelectValue placeholder={t('selectFeature')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="beneficiaries">{t('beneficiaries')}</SelectItem>
            <SelectItem value="push_notifications_monthly">{t('pushNotificationsMonthly')}</SelectItem>
            <SelectItem value="cashiers">{t('cashiers')}</SelectItem>
            <SelectItem value="branches">{t('branches')}</SelectItem>
            <SelectItem value="collaborators">{t('collaborators')}</SelectItem>
            <SelectItem value="redeemable_products">{t('redeemableProducts')}</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="feature" />
      </div>

      <div>
        <Label htmlFor="limit_value">{t('limitValueLabel')}</Label>
        <Input defaultValue={planLimit?.limit_value ?? ''} id="limit_value" name="limit_value" placeholder="100" type="number" min="0" />
        <FieldError actionState={validation ?? actionState} name="limit_value" />
      </div>

      <div>
        <Label htmlFor="warning_threshold">{t('warningThresholdLabel')}</Label>
        <Input defaultValue={planLimit?.warning_threshold ?? '0.8'} id="warning_threshold" name="warning_threshold" placeholder="0.8" type="number" step="0.01" min="0" max="1" />
        <FieldError actionState={validation ?? actionState} name="warning_threshold" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/plan_limits">{t('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {planLimit ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}
