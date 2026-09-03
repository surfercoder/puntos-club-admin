"use client";

import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';

import { organizationNotificationLimitFormAction } from '@/actions/dashboard/organization_notification_limits/organization_notification_limit-form-actions';
import { FormCancelSubmitActions } from '@/components/dashboard/shared/form-cancel-submit-actions';
import { NativeSelectField } from '@/components/dashboard/shared/native-select-field';
import { TextFormField } from '@/components/dashboard/shared/text-form-field';
import { useActionStateRedirect } from '@/components/dashboard/shared/use-action-state-redirect';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { buildNotificationLimitPayload, resolveNotificationLimitDefaults } from './organization-notification-limit-form-helpers';
import { OrganizationNotificationLimitSchema } from '@/schemas/organization_notification_limit.schema';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';
import { PLAN_LIMITS } from '@/types/organization_notification_limit';

interface OrganizationNotificationLimitFormProps {
  organizationNotificationLimit?: OrganizationNotificationLimit;
  organizations: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectTo?: string;
}

export default function OrganizationNotificationLimitForm({ 
  organizationNotificationLimit, 
  organizations,
  onSuccess, 
  onCancel, 
  redirectTo = "/dashboard/organization_notification_limits" 
}: OrganizationNotificationLimitFormProps) {
  const t = useTranslations('Dashboard.organizationNotificationLimit');
  const tCommon = useTranslations('Common');

  const [validation, setValidation] = useState<ActionState | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(organizationNotificationLimit?.plan_type ?? 'free');
  const [selectedOrganization, setSelectedOrganization] = useState<string>(organizationNotificationLimit?.organization_id ?? '');
  
  const [actionState, formAction, pending] = useActionState(organizationNotificationLimitFormAction, EMPTY_ACTION_STATE);
  useActionStateRedirect({ actionState, onSuccess, redirectTo });

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const formDataObject = Object.fromEntries(formData);
    setValidation(null);

    try {
      OrganizationNotificationLimitSchema.parse(buildNotificationLimitPayload(formDataObject));
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  const planLimits = PLAN_LIMITS[selectedPlan as keyof typeof PLAN_LIMITS];
  const defaults = resolveNotificationLimitDefaults(organizationNotificationLimit, planLimits);

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {organizationNotificationLimit?.id && <input name="id" type="hidden" value={organizationNotificationLimit.id} />}
      
      <NativeSelectField
        actionState={validation ?? actionState}
        disabled={!!organizationNotificationLimit}
        label={t('form.organizationLabel')}
        name="organization_id"
        value={selectedOrganization}
        onChange={setSelectedOrganization}
      >
        <option value="">{t('form.selectOrganization')}</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </NativeSelectField>

      <div>
        <NativeSelectField
          actionState={validation ?? actionState}
          label={t('form.planType')}
          name="plan_type"
          value={selectedPlan}
          onChange={handlePlanChange}
        >
          <option value="free">{t('form.planFree')}</option>
          <option value="light">{t('form.planLight')}</option>
          <option value="pro">{t('form.planPro')}</option>
          <option value="premium">{t('form.planPremium')}</option>
        </NativeSelectField>
        {planLimits && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('form.defaultLimits', { daily: planLimits.daily, monthly: planLimits.monthly, minHours: planLimits.minHours })}
          </p>
        )}
      </div>

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.dailyLimit}
        label={t('form.dailyLimit')}
        name="daily_limit"
        placeholder={t('form.dailyLimitPlaceholder')}
        type="number"
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.monthlyLimit}
        label={t('form.monthlyLimit')}
        name="monthly_limit"
        placeholder={t('form.monthlyLimitPlaceholder')}
        type="number"
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={defaults.minHours}
        label={t('form.minHours')}
        name="min_hours_between_notifications"
        placeholder={t('form.minHoursPlaceholder')}
        type="number"
      />

      <FormCancelSubmitActions
        cancelHref="/dashboard/organization_notification_limits"
        cancelLabel={tCommon('cancel')}
        createLabel={tCommon('create')}
        isEditing={!!organizationNotificationLimit}
        pending={pending}
        updateLabel={tCommon('update')}
        onCancel={onCancel}
      />
    </form>
  );
}
