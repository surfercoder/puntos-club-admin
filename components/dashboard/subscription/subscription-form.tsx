"use client";

import Link from 'next/link';
import { useActionState, useState, useEffect } from 'react';

import { subscriptionFormAction } from '@/actions/dashboard/subscription/subscription-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionSchema } from '@/schemas/subscription.schema';
import type { Subscription } from '@/types/subscription';

interface SubscriptionFormProps {
  subscription?: Subscription;
}

export default function SubscriptionForm({ subscription }: SubscriptionFormProps) {
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

      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select defaultValue={subscription?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="mp_preapproval_id">MercadoPago Preapproval ID</Label>
        <Input defaultValue={subscription?.mp_preapproval_id ?? ''} id="mp_preapproval_id" name="mp_preapproval_id" placeholder="preapproval_..." type="text" />
        <FieldError actionState={validation ?? actionState} name="mp_preapproval_id" />
      </div>

      <div>
        <Label htmlFor="mp_plan_id">MercadoPago Plan ID</Label>
        <Input defaultValue={subscription?.mp_plan_id ?? ''} id="mp_plan_id" name="mp_plan_id" placeholder="plan_..." type="text" />
        <FieldError actionState={validation ?? actionState} name="mp_plan_id" />
      </div>

      <div>
        <Label htmlFor="plan">Plan</Label>
        <Select defaultValue={subscription?.plan ?? 'advance'} name="plan">
          <SelectTrigger>
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="advance">Advance</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="plan" />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select defaultValue={subscription?.status ?? 'pending'} name="status">
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="authorized">Authorized</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="status" />
      </div>

      <div>
        <Label htmlFor="payer_email">Payer Email</Label>
        <Input defaultValue={subscription?.payer_email ?? ''} id="payer_email" name="payer_email" placeholder="email@example.com" type="email" />
        <FieldError actionState={validation ?? actionState} name="payer_email" />
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input defaultValue={subscription?.amount ?? ''} id="amount" name="amount" placeholder="0.00" type="number" step="0.01" />
        <FieldError actionState={validation ?? actionState} name="amount" />
      </div>

      <div>
        <Label htmlFor="currency">Currency</Label>
        <Input defaultValue={subscription?.currency ?? 'ARS'} id="currency" name="currency" placeholder="ARS" type="text" />
        <FieldError actionState={validation ?? actionState} name="currency" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/subscription">Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {subscription ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
