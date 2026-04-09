"use client";

import Link from 'next/link';
import { useActionState, useState, useEffect, useReducer } from 'react';

import { purchaseFormAction } from '@/actions/dashboard/purchase/purchase-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { PurchaseSchema } from '@/schemas/purchase.schema';
import type { Purchase } from '@/types/purchase';

interface PurchaseFormProps {
  purchase?: Purchase;
}

type Person = { id: string; first_name: string; last_name: string };
type NamedEntity = { id: string; name: string };

interface FormDataState {
  beneficiaries: Person[];
  cashiers: Person[];
  branches: NamedEntity[];
  organizations: NamedEntity[];
}

const initialFormData: FormDataState = {
  beneficiaries: [],
  cashiers: [],
  branches: [],
  organizations: [],
};

function formDataReducer(state: FormDataState, action: Partial<FormDataState>): FormDataState {
  return { ...state, ...action };
}

export default function PurchaseForm({ purchase }: PurchaseFormProps) {
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [{ beneficiaries, cashiers, branches, organizations }, dispatchFormData] = useReducer(
    formDataReducer,
    initialFormData,
  );

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [bRes, cRes, brRes, oRes] = await Promise.all([
        supabase.from('beneficiary').select('id, first_name, last_name').order('first_name'),
        supabase.from('app_user').select('id, first_name, last_name').order('first_name'),
        supabase.from('branch').select('id, name').order('name'),
        supabase.from('organization').select('id, name').order('name'),
      ]);
      dispatchFormData({
        beneficiaries: bRes.data ?? [],
        cashiers: cRes.data ?? [],
        branches: brRes.data ?? [],
        organizations: oRes.data ?? [],
      });
    }
    loadData();
  }, []);

  const [actionState, formAction, pending] = useActionState(purchaseFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      PurchaseSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {purchase?.id && <input name="id" type="hidden" value={purchase.id} />}

      <div>
        <Label htmlFor="beneficiary_id">Beneficiary</Label>
        <Select defaultValue={purchase?.beneficiary_id ?? ''} name="beneficiary_id">
          <SelectTrigger><SelectValue placeholder="Select beneficiary" /></SelectTrigger>
          <SelectContent>
            {beneficiaries.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.first_name} {b.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="cashier_id">Cashier</Label>
        <Select defaultValue={purchase?.cashier_id ?? ''} name="cashier_id">
          <SelectTrigger><SelectValue placeholder="Select cashier" /></SelectTrigger>
          <SelectContent>
            {cashiers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.first_name} {c.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="cashier_id" />
      </div>

      <div>
        <Label htmlFor="branch_id">Branch</Label>
        <Select defaultValue={purchase?.branch_id ?? ''} name="branch_id">
          <SelectTrigger><SelectValue placeholder="Select branch (optional)" /></SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select defaultValue={purchase?.organization_id ?? ''} name="organization_id">
          <SelectTrigger><SelectValue placeholder="Select organization (optional)" /></SelectTrigger>
          <SelectContent>
            {organizations.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="total_amount">Total Amount</Label>
        <Input defaultValue={purchase?.total_amount ?? ''} id="total_amount" name="total_amount" placeholder="0.00" type="number" step="0.01" min="0" />
        <FieldError actionState={validation ?? actionState} name="total_amount" />
      </div>

      <div>
        <Label htmlFor="points_earned">Points Earned</Label>
        <Input defaultValue={purchase?.points_earned ?? '0'} id="points_earned" name="points_earned" placeholder="0" type="number" min="0" />
        <FieldError actionState={validation ?? actionState} name="points_earned" />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea defaultValue={purchase?.notes ?? ''} id="notes" name="notes" placeholder="Optional notes" rows={3} />
        <FieldError actionState={validation ?? actionState} name="notes" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/purchase">Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {purchase ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
