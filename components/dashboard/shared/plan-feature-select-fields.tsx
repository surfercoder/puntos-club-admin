import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';

interface PlanFeatureFieldProps {
  defaultValue: string;
  actionState: ActionState;
  // Scoped translator; both plan_limits and organization_plan_limits forms
  // expose the same key names (planLabel, selectPlan, trial, ...).
  t: (key: string) => string;
}

// Shared "plan" select, repeated identically between plan-limit-form and
// organization-plan-limit-form.
export function PlanSelectField({ defaultValue, actionState, t }: PlanFeatureFieldProps) {
  return (
    <div>
      <Label htmlFor="plan">{t('planLabel')}</Label>
      <Select defaultValue={defaultValue} name="plan">
        <SelectTrigger id="plan"><SelectValue placeholder={t('selectPlan')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="trial">{t('trial')}</SelectItem>
          <SelectItem value="advance">{t('advance')}</SelectItem>
          <SelectItem value="pro">{t('pro')}</SelectItem>
        </SelectContent>
      </Select>
      <FieldError actionState={actionState} name="plan" />
    </div>
  );
}

// Shared "feature" select, repeated identically between plan-limit-form and
// organization-plan-limit-form.
export function FeatureSelectField({ defaultValue, actionState, t }: PlanFeatureFieldProps) {
  return (
    <div>
      <Label htmlFor="feature">{t('featureLabel')}</Label>
      <Select defaultValue={defaultValue} name="feature">
        <SelectTrigger id="feature"><SelectValue placeholder={t('selectFeature')} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="beneficiaries">{t('beneficiaries')}</SelectItem>
          <SelectItem value="push_notifications_monthly">{t('pushNotificationsMonthly')}</SelectItem>
          <SelectItem value="cashiers">{t('cashiers')}</SelectItem>
          <SelectItem value="branches">{t('branches')}</SelectItem>
          <SelectItem value="collaborators">{t('collaborators')}</SelectItem>
          <SelectItem value="redeemable_products">{t('redeemableProducts')}</SelectItem>
        </SelectContent>
      </Select>
      <FieldError actionState={actionState} name="feature" />
    </div>
  );
}
