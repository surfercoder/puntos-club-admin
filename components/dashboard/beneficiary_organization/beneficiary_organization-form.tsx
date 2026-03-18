"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { beneficiaryOrganizationFormAction } from '@/actions/dashboard/beneficiary_organization/beneficiary_organization-form-actions';
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

export default function BeneficiaryOrganizationForm({ beneficiaryOrganization }: BeneficiaryOrganizationFormProps) {
  const t = useTranslations('Dashboard.beneficiaryOrganization');
  const tCommon = useTranslations('Common');

  const [validation, setValidation] = useState<ActionState | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([]);
  const [orgs, setOrgs] = useState<OrganizationOption[]>([]);

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
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    redirect('/dashboard/beneficiary_organization');
  }

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

      <div>
        <Label htmlFor="beneficiary_id">{t('form.beneficiaryLabel')}</Label>
        <Select defaultValue={beneficiaryOrganization?.beneficiary_id ?? ''} name="beneficiary_id">
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
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="organization_id">{t('form.organizationLabel')}</Label>
        <Select defaultValue={beneficiaryOrganization?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectOrganization')} />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="available_points">{t('form.availablePoints')}</Label>
        <Input
          aria-describedby="available_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.available_points}
          defaultValue={beneficiaryOrganization?.available_points ?? 0}
          id="available_points"
          name="available_points"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="available_points" />
      </div>

      <div>
        <Label htmlFor="total_points_earned">{t('form.totalPointsEarned')}</Label>
        <Input
          aria-describedby="total_points_earned-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.total_points_earned}
          defaultValue={beneficiaryOrganization?.total_points_earned ?? 0}
          id="total_points_earned"
          name="total_points_earned"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="total_points_earned" />
      </div>

      <div>
        <Label htmlFor="total_points_redeemed">{t('form.totalPointsRedeemed')}</Label>
        <Input
          aria-describedby="total_points_redeemed-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.total_points_redeemed}
          defaultValue={beneficiaryOrganization?.total_points_redeemed ?? 0}
          id="total_points_redeemed"
          name="total_points_redeemed"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="total_points_redeemed" />
      </div>

      <div className="flex items-center space-x-2">
        <input
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
