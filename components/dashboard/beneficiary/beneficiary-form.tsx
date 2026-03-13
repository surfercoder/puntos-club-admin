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

export default function BeneficiaryForm({ beneficiary }: BeneficiaryFormProps) {
  const t = useTranslations('Dashboard.beneficiary.form');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(beneficiaryFormAction, EMPTY_ACTION_STATE);
  const { invalidate } = usePlanUsage();

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    invalidate();
    redirect("/dashboard/beneficiary");
  }

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
      <div>
        <Label htmlFor="first_name">{t('firstNameLabel')}</Label>
        <Input
          aria-describedby="first_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
          defaultValue={beneficiary?.first_name ?? ''}
          id="first_name"
          name="first_name"
          placeholder={t('firstNamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="first_name" />
      </div>

      <div>
        <Label htmlFor="last_name">{t('lastNameLabel')}</Label>
        <Input
          aria-describedby="last_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
          defaultValue={beneficiary?.last_name ?? ''}
          id="last_name"
          name="last_name"
          placeholder={t('lastNamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="last_name" />
      </div>

      <div>
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          aria-describedby="email-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          defaultValue={beneficiary?.email ?? ''}
          id="email"
          name="email"
          placeholder={t('emailPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input
          aria-describedby="phone-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.phone}
          defaultValue={beneficiary?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder={t('phonePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="document_id">{t('dniLabel')}</Label>
        <Input
          aria-describedby="document_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.document_id}
          defaultValue={beneficiary?.document_id ?? ''}
          id="document_id"
          name="document_id"
          placeholder={t('dniPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="document_id" />
      </div>

      <div>
        <Label htmlFor="available_points">{t('pointsLabel')}</Label>
        <Input
          aria-describedby="available_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.available_points}
          defaultValue={beneficiary?.available_points ?? 0}
          id="available_points"
          name="available_points"
          placeholder={t('pointsPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="available_points" />
      </div>

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
