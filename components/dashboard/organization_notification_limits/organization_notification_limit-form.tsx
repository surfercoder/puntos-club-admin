"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(organizationNotificationLimit?.plan_type ?? 'free');
  const [selectedOrganization, setSelectedOrganization] = useState<string>(organizationNotificationLimit?.organization_id ?? '');
  
  const [actionState, formAction, pending] = useActionState(organizationNotificationLimitFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      const hasErrors = Object.values(actionState.fieldErrors ?? {}).some((v) => (v?.length ?? 0) > 0);

      if (hasErrors) {
        toast.error(actionState.message);
        return;
      }

      toast.success(actionState.message);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
          return;
        }

        if (redirectTo) {
          router.refresh();
          router.push(redirectTo);
        }
      }, 500);
    }
  }, [actionState, onSuccess, redirectTo, router]);

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
        <Label htmlFor="organization_id">Organization</Label>
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
          <option value="">Select an organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="plan_type">Plan Type</Label>
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
            Default limits: {planLimits.daily} daily, {planLimits.monthly} monthly, {planLimits.minHours}h between notifications
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="daily_limit">Daily Limit</Label>
        <Input
          aria-describedby="daily_limit-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.daily_limit}
          defaultValue={organizationNotificationLimit?.daily_limit ?? planLimits?.daily ?? 1}
          id="daily_limit"
          name="daily_limit"
          placeholder="Enter daily limit"
          type="number"
          min="1"
        />
        <FieldError actionState={validation ?? actionState} name="daily_limit" />
      </div>

      <div>
        <Label htmlFor="monthly_limit">Monthly Limit</Label>
        <Input
          aria-describedby="monthly_limit-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.monthly_limit}
          defaultValue={organizationNotificationLimit?.monthly_limit ?? planLimits?.monthly ?? 5}
          id="monthly_limit"
          name="monthly_limit"
          placeholder="Enter monthly limit"
          type="number"
          min="1"
        />
        <FieldError actionState={validation ?? actionState} name="monthly_limit" />
      </div>

      <div>
        <Label htmlFor="min_hours_between_notifications">Min Hours Between Notifications</Label>
        <Input
          aria-describedby="min_hours_between_notifications-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.min_hours_between_notifications}
          defaultValue={organizationNotificationLimit?.min_hours_between_notifications ?? planLimits?.minHours ?? 24}
          id="min_hours_between_notifications"
          name="min_hours_between_notifications"
          placeholder="Enter minimum hours between notifications"
          type="number"
          min="1"
        />
        <FieldError actionState={validation ?? actionState} name="min_hours_between_notifications" />
      </div>

      <div className="flex gap-2">
        {onCancel ? (
          <Button className="w-full" type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button asChild className="w-full" type="button" variant="secondary">
            <Link href="/dashboard/organization_notification_limits">Cancel</Link>
          </Button>
        )}
        <Button className="w-full" disabled={pending} type="submit">
          {organizationNotificationLimit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
