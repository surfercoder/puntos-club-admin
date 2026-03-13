"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { organizationFormAction } from '@/actions/dashboard/organization/organization-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { OrganizationSchema } from '@/schemas/organization.schema';
import type { Organization } from '@/types/organization';

interface OrganizationFormProps {
  organization?: Organization;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectTo?: string;
}

export default function OrganizationForm({ organization, onSuccess, onCancel, redirectTo = "/dashboard/organization" }: OrganizationFormProps) {
  const t = useTranslations('Dashboard.organization');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(organization?.logo_url ?? null);

  // Utils
  const [actionState, formAction, pending] = useActionState(organizationFormAction, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (actionState.status === 'success' && onSuccess) {
      toast.success(actionState.message);
      onSuccess();
    } else if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState, onSuccess]);

  if (actionState.status === 'success' && !onSuccess) {
    toast.success(actionState.message);
    redirect(redirectTo ?? "/dashboard/organization");
  }

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    
    if (logoUrl) {
      formData.set('logo_url', logoUrl);
    }
    
    const formDataObject = Object.fromEntries(formData);
    setValidation(null);

    try {
      OrganizationSchema.parse(formDataObject);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {organization?.id && <input name="id" type="hidden" value={organization.id} />}
      
      <div>
        <Label htmlFor="name">{t('form.nameLabel')}</Label>
        <Input
          aria-describedby="name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          defaultValue={organization?.name ?? ''}
          id="name"
          name="name"
          placeholder={t('form.namePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="business_name">{t('form.legalName')}</Label>
        <Input
          aria-describedby="business_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.business_name}
          defaultValue={organization?.business_name ?? ''}
          id="business_name"
          name="business_name"
          placeholder={t('form.legalNamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="business_name" />
      </div>

      <div>
        <Label htmlFor="tax_id">{t('form.taxId')}</Label>
        <Input
          aria-describedby="tax_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.tax_id}
          defaultValue={organization?.tax_id ?? ''}
          id="tax_id"
          name="tax_id"
          placeholder={t('form.taxIdPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="tax_id" />
      </div>

      <div>
        <Label htmlFor="logo_url">{t('form.logoLabel')}</Label>
        <ImageUpload
          aspectRatio="auto"
          bucket="organization-logos"
          disabled={pending}
          maxHeight={150}
          maxSizeMB={5}
          path="logos"
          value={logoUrl}
          onChange={setLogoUrl}
        />
        <input name="logo_url" type="hidden" value={logoUrl ?? ''} />
        <FieldError actionState={validation ?? actionState} name="logo_url" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {tCommon('cancel')}
          </Button>
        ) : (
          <Button asChild type="button" variant="secondary">
            <Link href="/dashboard/organization">{tCommon('cancel')}</Link>
          </Button>
        )}
        <Button disabled={pending} type="submit">
          {organization ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
