"use client";

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { organizationPlanLimitFormAction } from '@/actions/dashboard/organization_plan_limits/organization-plan-limit-form-actions';
import { OrganizationSelectField } from '@/components/dashboard/shared/organization-select-field';
import { FeatureSelectField, PlanSelectField } from '@/components/dashboard/shared/plan-feature-select-fields';
import { useOrganizations } from '@/components/dashboard/shared/use-organizations';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { OrganizationPlanLimitSchema } from '@/schemas/organization_plan_limit.schema';
import type { OrganizationPlanLimit } from '@/types/organization_plan_limit';

interface OrganizationPlanLimitFormProps {
  organizationPlanLimit?: OrganizationPlanLimit;
}

export default function OrganizationPlanLimitForm({ organizationPlanLimit }: OrganizationPlanLimitFormProps) {
  const t = useTranslations('Dashboard.orgPlanLimits.form');
  const [validation, setValidation] = useState<ActionState | null>(null);
  const organizations = useOrganizations();

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

      <OrganizationSelectField
        actionState={validation ?? actionState}
        defaultValue={organizationPlanLimit?.organization_id ?? ''}
        label={t('organizationLabel')}
        organizations={organizations}
        placeholder={t('selectOrganization')}
      />

      <PlanSelectField actionState={validation ?? actionState} defaultValue={organizationPlanLimit?.plan ?? 'trial'} t={t} />

      <FeatureSelectField actionState={validation ?? actionState} defaultValue={organizationPlanLimit?.feature ?? ''} t={t} />

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
