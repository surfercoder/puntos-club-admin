"use client";

import Link from 'next/link';
import { useActionState, useState, useEffect, useReducer } from 'react';
import { useTranslations } from 'next-intl';

import { organizationPlanLimitFormAction } from '@/actions/dashboard/organization_plan_limits/organization-plan-limit-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { OrganizationPlanLimitSchema } from '@/schemas/organization_plan_limit.schema';
import type { OrganizationPlanLimit } from '@/types/organization_plan_limit';

interface OrganizationPlanLimitFormProps {
  organizationPlanLimit?: OrganizationPlanLimit;
}

export default function OrganizationPlanLimitForm({ organizationPlanLimit }: OrganizationPlanLimitFormProps) {
  const t = useTranslations('Dashboard.orgPlanLimits.form');
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

  const [actionState, formAction, pending] = useActionState(organizationPlanLimitFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      OrganizationPlanLimitSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {organizationPlanLimit?.id && <input name="id" type="hidden" value={organizationPlanLimit.id} />}

      <div>
        <Label htmlFor="organization_id">{t('organizationLabel')}</Label>
        <Select defaultValue={organizationPlanLimit?.organization_id ?? ''} name="organization_id">
          <SelectTrigger><SelectValue placeholder={t('selectOrganization')} /></SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="plan">{t('planLabel')}</Label>
        <Select defaultValue={organizationPlanLimit?.plan ?? 'trial'} name="plan">
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
        <Select defaultValue={organizationPlanLimit?.feature ?? ''} name="feature">
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
        <Input defaultValue={organizationPlanLimit?.limit_value ?? ''} id="limit_value" name="limit_value" placeholder="100" type="number" min="0" />
        <FieldError actionState={validation ?? actionState} name="limit_value" />
      </div>

      <div>
        <Label htmlFor="warning_threshold">{t('warningThresholdLabel')}</Label>
        <Input defaultValue={organizationPlanLimit?.warning_threshold ?? '0.8'} id="warning_threshold" name="warning_threshold" placeholder="0.8" type="number" step="0.01" min="0" max="1" />
        <FieldError actionState={validation ?? actionState} name="warning_threshold" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/organization_plan_limits">{t('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {organizationPlanLimit ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}
