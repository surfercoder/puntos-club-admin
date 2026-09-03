"use client";

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from "sonner";

import { beneficiaryFormAction } from '@/actions/dashboard/beneficiary/beneficiary-form-actions';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';
import type { Beneficiary } from '@/types/beneficiary';

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary;
}

type BeneficiaryTextFieldName = 'first_name' | 'last_name' | 'email' | 'phone' | 'document_id';

function BeneficiaryTextField({
  name,
  label,
  placeholder,
  defaultValue,
  actionState,
}: {
  name: BeneficiaryTextFieldName;
  label: string;
  placeholder: string;
  defaultValue: string;
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
        placeholder={placeholder}
        type="text"
      />
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}

export default function BeneficiaryForm({ beneficiary }: BeneficiaryFormProps) {
  const t = useTranslations('Dashboard.beneficiary.form');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(beneficiaryFormAction, EMPTY_ACTION_STATE);
  const { invalidate: _invalidate } = usePlanUsage();
  const currentActionState = validation ?? actionState;

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
    if (actionState.status === 'success') {
      toast.success(actionState.message);
      redirect("/dashboard/beneficiary");
    }
  }, [actionState]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      BeneficiarySchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {beneficiary?.id && <input name="id" type="hidden" value={beneficiary.id} />}
      <BeneficiaryTextField
        actionState={currentActionState}
        defaultValue={beneficiary?.first_name ?? ''}
        label={t('firstNameLabel')}
        name="first_name"
        placeholder={t('firstNamePlaceholder')}
      />

      <BeneficiaryTextField
        actionState={currentActionState}
        defaultValue={beneficiary?.last_name ?? ''}
        label={t('lastNameLabel')}
        name="last_name"
        placeholder={t('lastNamePlaceholder')}
      />

      <BeneficiaryTextField
        actionState={currentActionState}
        defaultValue={beneficiary?.email ?? ''}
        label={t('emailLabel')}
        name="email"
        placeholder={t('emailPlaceholder')}
      />

      <BeneficiaryTextField
        actionState={currentActionState}
        defaultValue={beneficiary?.phone ?? ''}
        label={t('phoneLabel')}
        name="phone"
        placeholder={t('phonePlaceholder')}
      />

      <BeneficiaryTextField
        actionState={currentActionState}
        defaultValue={beneficiary?.document_id ?? ''}
        label={t('dniLabel')}
        name="document_id"
        placeholder={t('dniPlaceholder')}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/beneficiary">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {beneficiary ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
