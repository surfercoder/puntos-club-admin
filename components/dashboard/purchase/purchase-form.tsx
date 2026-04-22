"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useActionState, useState, useEffect, useReducer, useCallback } from 'react';

import { purchaseFormAction } from '@/actions/dashboard/purchase/purchase-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

const initialFormData: FormDataState = {
  beneficiaries: [],
  cashiers: [],
  branches: [],
};

const CASHIER_ROLE_NAME = 'cashier';

function formDataReducer(state: FormDataState, action: Partial<FormDataState>): FormDataState {
  return { ...state, ...action };
}

function getOrgIdFromCookies(): number | null {
  try {
    const activeOrgId = document.cookie
      .split('; ')
      .find(row => row.startsWith('active_org_id='))
      ?.split('=')[1];
    if (activeOrgId) {
      const parsed = Number(activeOrgId);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export default function PurchaseForm({ purchase }: PurchaseFormProps) {
  const t = useTranslations('Dashboard.purchase');
  const tCommon = useTranslations('Common');

  const [validation, setValidation] = useState<ActionState | null>(null);
  const [pointsPreview, setPointsPreview] = useState<number | null>(purchase?.points_earned ?? null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(purchase?.branch_id ? String(purchase.branch_id) : '');
  const [{ beneficiaries, cashiers, branches }, dispatchFormData] = useReducer(
    formDataReducer,
    initialFormData,
  );

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const orgIdNumber = getOrgIdFromCookies();

      // Build beneficiaries query filtered by organization
      let beneficiariesPromise;
      if (orgIdNumber) {
        beneficiariesPromise = supabase
          .from('beneficiary_organization')
          .select('beneficiary:beneficiary_id(id, first_name, last_name)')
          .eq('organization_id', orgIdNumber)
          .eq('is_active', true);
      } else {
        beneficiariesPromise = supabase
          .from('beneficiary')
          .select('id, first_name, last_name')
          .order('first_name');
      }

      // Look up cashier role ID dynamically
      const { data: cashierRole } = await supabase
        .from('user_role')
        .select('id')
        .eq('name', CASHIER_ROLE_NAME)
        .single();

      // Build cashiers query filtered by organization and cashier role
      let cashiersQuery = supabase
        .from('app_user')
        .select('id, first_name, last_name')
        .eq('role_id', cashierRole?.id ?? -1)
        .order('first_name');
      let branchesQuery = supabase.from('branch').select('id, name').order('name');
      if (orgIdNumber) {
        cashiersQuery = cashiersQuery.eq('organization_id', orgIdNumber);
        branchesQuery = branchesQuery.eq('organization_id', orgIdNumber);
      }

      const [bRes, cRes, brRes] = await Promise.all([
        beneficiariesPromise,
        cashiersQuery,
        branchesQuery,
      ]);

      let loadedBeneficiaries: Person[] = [];
      if (bRes.data) {
        if (orgIdNumber) {
          const nested = bRes.data as unknown as { beneficiary: Person }[];
          loadedBeneficiaries = nested.flatMap(r => r.beneficiary ? [r.beneficiary] : []);
        } else {
          loadedBeneficiaries = bRes.data as unknown as Person[];
        }
      }

      dispatchFormData({
        beneficiaries: loadedBeneficiaries,
        cashiers: cRes.data ?? [],
        branches: brRes.data ?? [],
      });
    }
    loadData();
  }, []);

  // Live points calculation using the same RPC as the server
  const calculatePoints = useCallback(async (amount: number, branchId: string) => {
    if (amount <= 0) {
      setPointsPreview(0);
      return;
    }
    const supabase = createClient();
    const orgIdNumber = getOrgIdFromCookies();
    const branchIdNumber = branchId ? parseInt(branchId, 10) : null;
    const { data } = await supabase.rpc('calculate_points_for_amount', {
      p_amount: amount,
      p_organization_id: orgIdNumber,
      p_branch_id: branchIdNumber,
      p_category_id: null,
    });
    setPointsPreview(data || 0);
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value);
    if (!isNaN(amount)) {
      calculatePoints(amount, selectedBranchId);
    } else {
      setPointsPreview(null);
    }
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value);
    const amountInput = document.querySelector<HTMLInputElement>('input[name="total_amount"]');
    const amount = parseFloat(amountInput?.value ?? '');
    if (!isNaN(amount) && amount > 0) {
      calculatePoints(amount, value);
    }
  };

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
        <Label htmlFor="beneficiary_id">{t('form.beneficiaryLabel')}</Label>
        <Select defaultValue={purchase?.beneficiary_id ? String(purchase.beneficiary_id) : ''} name="beneficiary_id">
          <SelectTrigger><SelectValue placeholder={t('form.selectBeneficiary')} /></SelectTrigger>
          <SelectContent>
            {beneficiaries.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.first_name} {b.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="cashier_id">{t('form.cashierLabel')}</Label>
        <Select defaultValue={purchase?.cashier_id ? String(purchase.cashier_id) : ''} name="cashier_id">
          <SelectTrigger><SelectValue placeholder={t('form.selectCashier')} /></SelectTrigger>
          <SelectContent>
            {cashiers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.first_name} {c.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="cashier_id" />
      </div>

      <div>
        <Label htmlFor="branch_id">{t('form.branchLabel')}</Label>
        <Select defaultValue={purchase?.branch_id ? String(purchase.branch_id) : ''} name="branch_id" onValueChange={handleBranchChange}>
          <SelectTrigger><SelectValue placeholder={t('form.selectBranch')} /></SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div>
        <Label htmlFor="total_amount">{t('form.totalAmountLabel')}</Label>
        <Input
          defaultValue={purchase?.total_amount ?? ''}
          id="total_amount"
          name="total_amount"
          placeholder="0.00"
          type="number"
          step="0.01"
          min="0"
          onChange={handleAmountChange}
        />
        <FieldError actionState={validation ?? actionState} name="total_amount" />
      </div>

      {pointsPreview !== null && (
        <div className="rounded-md bg-muted px-4 py-3 text-sm">
          <span className="font-medium">{t('form.pointsEarnedLabel')}:</span>{' '}
          <span className="text-primary font-semibold">{pointsPreview}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/purchase">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {purchase ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
