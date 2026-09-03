"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useEffect, useReducer, useState } from 'react';
import { toast } from 'sonner';

import { beneficiaryOrganizationFormAction } from '@/actions/dashboard/beneficiary_organization/beneficiary_organization-form-actions';
import { OrganizationSelectField } from '@/components/dashboard/shared/organization-select-field';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { BeneficiaryOrganizationSchema } from '@/schemas/beneficiary_organization.schema';
import type { BeneficiaryOrganization } from '@/schemas/beneficiary_organization.schema';

interface BeneficiaryOrganizationFormProps {
  beneficiaryOrganization?: BeneficiaryOrganization;
}

interface BeneficiaryOption {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface OrganizationOption {
  id: string;
  name: string;
}

function BeneficiarySelectField({
  beneficiaries,
  defaultValue,
  actionState,
  t,
}: {
  beneficiaries: BeneficiaryOption[];
  defaultValue: string;
  actionState: ActionState;
  t: (key: string) => string;
}) {
  return (
    <div>
      <Label htmlFor="beneficiary_id">{t('form.beneficiaryLabel')}</Label>
      <Select defaultValue={defaultValue} name="beneficiary_id">
        <SelectTrigger>
          <SelectValue placeholder={t('form.selectBeneficiary')} />
        </SelectTrigger>
        <SelectContent>
          {beneficiaries.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {/* c8 ignore next */ b.first_name || b.last_name ? `${b.first_name || ''} ${b.last_name || ''}`.trim() : b.email || t('form.noName')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError actionState={actionState} name="beneficiary_id" />
    </div>
  );
}

type PointsFieldName = 'available_points' | 'total_points_earned' | 'total_points_redeemed';

function PointsNumberField({
  name,
  label,
  defaultValue,
  actionState,
}: {
  name: PointsFieldName;
  label: string;
  defaultValue: number;
  actionState: ActionState;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        aria-describedby={`${name}-error`}
        aria-invalid={!!actionState.fieldErrors?.[name]}
        defaultValue={defaultValue}
        id={name}
        name={name}
        type="number"
      />
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}

export default function BeneficiaryOrganizationForm({ beneficiaryOrganization }: BeneficiaryOrganizationFormProps) {
  const t = useTranslations('Dashboard.beneficiaryOrganization');
  const tCommon = useTranslations('Common');

  const [validation, setValidation] = useState<ActionState | null>(null);
  const [beneficiaries, setBeneficiaries] = useReducer((_: BeneficiaryOption[], next: BeneficiaryOption[]) => next, [] as BeneficiaryOption[]);
  const [orgs, setOrgs] = useReducer((_: OrganizationOption[], next: OrganizationOption[]) => next, [] as OrganizationOption[]);

  const [actionState, formAction, pending] = useActionState(beneficiaryOrganizationFormAction, EMPTY_ACTION_STATE);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [beneficiariesResult, orgsResult] = await Promise.all([
        supabase.from('beneficiary').select('id, first_name, last_name, email').order('first_name'),
        supabase.from('organization').select('id, name').order('name'),
      ]);

      if (beneficiariesResult.data) setBeneficiaries(beneficiariesResult.data);
      if (orgsResult.data) setOrgs(orgsResult.data);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
    if (actionState.status === 'success') {
      toast.success(actionState.message);
      redirect('/dashboard/beneficiary_organization');
    }
  }, [actionState]);

  const currentActionState = validation ?? actionState;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      BeneficiaryOrganizationSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {beneficiaryOrganization?.id && <input name="id" type="hidden" value={beneficiaryOrganization.id} />}

      <BeneficiarySelectField
        actionState={currentActionState}
        beneficiaries={beneficiaries}
        defaultValue={beneficiaryOrganization?.beneficiary_id ?? ''}
        t={t}
      />

      <OrganizationSelectField
        actionState={currentActionState}
        defaultValue={beneficiaryOrganization?.organization_id ?? ''}
        label={t('form.organizationLabel')}
        organizations={orgs}
        placeholder={t('form.selectOrganization')}
      />

      <PointsNumberField
        actionState={currentActionState}
        defaultValue={beneficiaryOrganization?.available_points ?? 0}
        label={t('form.availablePoints')}
        name="available_points"
      />

      <PointsNumberField
        actionState={currentActionState}
        defaultValue={beneficiaryOrganization?.total_points_earned ?? 0}
        label={t('form.totalPointsEarned')}
        name="total_points_earned"
      />

      <PointsNumberField
        actionState={currentActionState}
        defaultValue={beneficiaryOrganization?.total_points_redeemed ?? 0}
        label={t('form.totalPointsRedeemed')}
        name="total_points_redeemed"
      />

      <div className="flex items-center gap-2">
        <input
          aria-label={t('form.activeLabel')}
          className="rounded"
          defaultChecked={beneficiaryOrganization?.is_active ?? true}
          id="is_active"
          name="is_active"
          type="checkbox"
        />
        <Label htmlFor="is_active">{t('form.activeLabel')}</Label>
        <FieldError actionState={validation ?? actionState} name="is_active" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/beneficiary_organization">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {beneficiaryOrganization ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
