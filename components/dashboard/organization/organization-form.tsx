"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';

import { organizationFormAction } from '@/actions/dashboard/organization/organization-form-actions';
import { TextFormField } from '@/components/dashboard/shared/text-form-field';
import { OrganizationTextareaField } from '@/components/dashboard/organization/organization-textarea-field';
import { useActionStateRedirect } from '@/components/dashboard/shared/use-action-state-redirect';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { ImageUpload } from '@/components/ui/image-upload';
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
  useActionStateRedirect({ actionState, onSuccess, redirectTo });

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
      
      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={organization?.name ?? ''}
        label={t('form.nameLabel')}
        name="name"
        placeholder={t('form.namePlaceholder')}
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={organization?.business_name ?? ''}
        label={t('form.legalName')}
        name="business_name"
        placeholder={t('form.legalNamePlaceholder')}
      />

      <TextFormField
        actionState={validation ?? actionState}
        defaultValue={organization?.tax_id ?? ''}
        label={t('form.taxId')}
        name="tax_id"
        placeholder={t('form.taxIdPlaceholder')}
      />

      <OrganizationTextareaField
        actionState={validation ?? actionState}
        defaultValue={organization?.public_info ?? ''}
        label={t('form.publicInfo')}
        name="public_info"
        placeholder={t('form.publicInfoPlaceholder')}
        rows={5}
      />

      <div>
        <Label htmlFor="logo_url">{t('form.logoLabel')}</Label>
        <ImageUpload
          aspectRatio="auto"
          bucket="logos"
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
