"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { organizationNotificationLimitFormAction } from '@/actions/dashboard/organization_notification_limits/organization_notification_limit-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
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

  useEffect(() => {
    if (actionState.status === 'success' && onSuccess) {
      toast.success(actionState.message);
      onSuccess();
    } else if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState, onSuccess]);

  if (actionState.status === 'success' && !onSuccess && redirectTo) {
    toast.success(actionState.message);
    redirect(redirectTo);
  }

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const formDataObject = Object.fromEntries(formData);
    setValidation(null);

    try {
      const parsedData = {
        ...formDataObject,
        daily_limit: formDataObject.daily_limit ? Number(formDataObject.daily_limit) : 1,
        monthly_limit: formDataObject.monthly_limit ? Number(formDataObject.monthly_limit) : 5,
        min_hours_between_notifications: formDataObject.min_hours_between_notifications ? Number(formDataObject.min_hours_between_notifications) : 24,
        /* c8 ignore next 2 */
        notifications_sent_today: formDataObject.notifications_sent_today ? Number(formDataObject.notifications_sent_today) : 0,
        notifications_sent_this_month: formDataObject.notifications_sent_this_month ? Number(formDataObject.notifications_sent_this_month) : 0,
      };
      OrganizationNotificationLimitSchema.parse(parsedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  const planLimits = PLAN_LIMITS[selectedPlan as keyof typeof PLAN_LIMITS];

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {organizationNotificationLimit?.id && <input name="id" type="hidden" value={organizationNotificationLimit.id} />}
      
      <div>
        <Label htmlFor="organization_id">{t('form.organizationLabel')}</Label>
        <select
          id="organization_id"
          name="organization_id"
          value={selectedOrganization}
          onChange={(e) => setSelectedOrganization(e.target.value)}
          disabled={!!organizationNotificationLimit}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="organization_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.organization_id}
        >
          <option value="">{t('form.selectOrganization')}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="plan_type">{t('form.planType')}</Label>
        <select
          id="plan_type"
          name="plan_type"
          value={selectedPlan}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="plan_type-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.plan_type}
        >
          <option value="free">Free</option>
          <option value="light">Light</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
        <FieldError actionState={validation ?? actionState} name="plan_type" />
        {planLimits && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('form.defaultLimits', { daily: planLimits.daily, monthly: planLimits.monthly, minHours: planLimits.minHours })}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="daily_limit">{t('form.dailyLimit')}</Label>
        <Input
          aria-describedby="daily_limit-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.daily_limit}
          defaultValue={organizationNotificationLimit?.daily_limit /* c8 ignore next */ ?? planLimits?.daily ?? 1}
          id="daily_limit"
          name="daily_limit"
          placeholder={t('form.dailyLimitPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="daily_limit" />
      </div>

      <div>
        <Label htmlFor="monthly_limit">{t('form.monthlyLimit')}</Label>
        <Input
          aria-describedby="monthly_limit-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.monthly_limit}
          defaultValue={organizationNotificationLimit?.monthly_limit /* c8 ignore next */ ?? planLimits?.monthly ?? 5}
          id="monthly_limit"
          name="monthly_limit"
          placeholder={t('form.monthlyLimitPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="monthly_limit" />
      </div>

      <div>
        <Label htmlFor="min_hours_between_notifications">{t('form.minHours')}</Label>
        <Input
          aria-describedby="min_hours_between_notifications-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.min_hours_between_notifications}
          defaultValue={organizationNotificationLimit?.min_hours_between_notifications /* c8 ignore next */ ?? planLimits?.minHours ?? 24}
          id="min_hours_between_notifications"
          name="min_hours_between_notifications"
          placeholder={t('form.minHoursPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="min_hours_between_notifications" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {tCommon('cancel')}
          </Button>
        ) : (
          <Button asChild type="button" variant="secondary">
            <Link href="/dashboard/organization_notification_limits">{tCommon('cancel')}</Link>
          </Button>
        )}
        <Button disabled={pending} type="submit">
          {organizationNotificationLimit ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
