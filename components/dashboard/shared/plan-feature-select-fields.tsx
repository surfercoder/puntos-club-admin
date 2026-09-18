'use client';

import { useTranslations } from 'next-intl';

import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLAN_FEATURE_ORDER, PLAN_ORDER } from '@/lib/plans/config';
import type { ActionState } from '@/lib/error-handler';

interface PlanFeatureFieldProps {
  defaultValue: string;
  actionState: ActionState;
  // Scoped translator; both plan_limits and organization_plan_limits forms
  // expose the same key names (planLabel, selectPlan, ...).
  t: (key: string) => string;
}

// Shared "plan" select, repeated identically between plan-limit-form and
// organization-plan-limit-form. Los nombres de plan y feature salen del mismo
// catálogo que las tarjetas de planes.
export function PlanSelectField({ defaultValue, actionState, t }: PlanFeatureFieldProps) {
  const tPlans = useTranslations('Onboarding.step3');
  return (
    <div>
      <Label htmlFor="plan">{t('planLabel')}</Label>
      <Select defaultValue={defaultValue} name="plan">
        <SelectTrigger id="plan"><SelectValue placeholder={t('selectPlan')} /></SelectTrigger>
        <SelectContent>
          {PLAN_ORDER.map((plan) => (
            <SelectItem key={plan} value={plan}>{tPlans(`${plan}Plan`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError actionState={actionState} name="plan" />
    </div>
  );
}

// Shared "feature" select, repeated identically between plan-limit-form and
// organization-plan-limit-form.
export function FeatureSelectField({ defaultValue, actionState, t }: PlanFeatureFieldProps) {
  const tPlans = useTranslations('Onboarding.step3');
  return (
    <div>
      <Label htmlFor="feature">{t('featureLabel')}</Label>
      <Select defaultValue={defaultValue} name="feature">
        <SelectTrigger id="feature"><SelectValue placeholder={t('selectFeature')} /></SelectTrigger>
        <SelectContent>
          {PLAN_FEATURE_ORDER.map((feature) => (
            <SelectItem key={feature} value={feature}>{tPlans(`features.${feature}`)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError actionState={actionState} name="feature" />
    </div>
  );
}
