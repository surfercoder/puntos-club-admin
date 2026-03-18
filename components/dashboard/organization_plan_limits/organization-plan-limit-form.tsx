"use client";

import Link from 'next/link';
import { useActionState, useState, useEffect } from 'react';

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
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);

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
        <Label htmlFor="organization_id">Organization</Label>
        <Select defaultValue={organizationPlanLimit?.organization_id ?? ''} name="organization_id">
          <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="plan">Plan</Label>
        <Select defaultValue={organizationPlanLimit?.plan ?? 'trial'} name="plan">
          <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="advance">Advance</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="plan" />
      </div>

      <div>
        <Label htmlFor="feature">Feature</Label>
        <Select defaultValue={organizationPlanLimit?.feature ?? ''} name="feature">
          <SelectTrigger><SelectValue placeholder="Select feature" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="beneficiaries">Beneficiaries</SelectItem>
            <SelectItem value="push_notifications_monthly">Push Notifications Monthly</SelectItem>
            <SelectItem value="cashiers">Cashiers</SelectItem>
            <SelectItem value="branches">Branches</SelectItem>
            <SelectItem value="collaborators">Collaborators</SelectItem>
            <SelectItem value="redeemable_products">Redeemable Products</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="feature" />
      </div>

      <div>
        <Label htmlFor="limit_value">Limit Value</Label>
        <Input defaultValue={organizationPlanLimit?.limit_value ?? ''} id="limit_value" name="limit_value" placeholder="100" type="number" min="0" />
        <FieldError actionState={validation ?? actionState} name="limit_value" />
      </div>

      <div>
        <Label htmlFor="warning_threshold">Warning Threshold (0-1)</Label>
        <Input defaultValue={organizationPlanLimit?.warning_threshold ?? '0.8'} id="warning_threshold" name="warning_threshold" placeholder="0.8" type="number" step="0.01" min="0" max="1" />
        <FieldError actionState={validation ?? actionState} name="warning_threshold" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/organization_plan_limits">Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {organizationPlanLimit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
