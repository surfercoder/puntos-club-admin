"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(organization?.logo_url ?? null);

  // Utils
  const [actionState, formAction, pending] = useActionState(organizationFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      const hasErrors = Object.values(actionState.fieldErrors ?? {}).some((v) => (v?.length ?? 0) > 0);

      if (hasErrors) {
        toast.error(actionState.message);
        return;
      }

      toast.success(actionState.message);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
          return;
        }

        if (redirectTo) {
          router.push(redirectTo);
        }
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, onSuccess, redirectTo, router]);

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
        <Label htmlFor="name">Name</Label>
        <Input
          aria-describedby="name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          defaultValue={organization?.name ?? ''}
          id="name"
          name="name"
          placeholder="Enter organization name"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="business_name">Business Name</Label>
        <Input
          aria-describedby="business_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.business_name}
          defaultValue={organization?.business_name ?? ''}
          id="business_name"
          name="business_name"
          placeholder="Enter business name (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="business_name" />
      </div>

      <div>
        <Label htmlFor="tax_id">Tax ID</Label>
        <Input
          aria-describedby="tax_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.tax_id}
          defaultValue={organization?.tax_id ?? ''}
          id="tax_id"
          name="tax_id"
          placeholder="Enter tax ID (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="tax_id" />
      </div>

      <div>
        <Label htmlFor="logo_url">Organization Logo</Label>
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

      <div className="flex gap-2">
        {onCancel ? (
          <Button className="w-full" type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button asChild className="w-full" type="button" variant="secondary">
            <Link href="/dashboard/organization">Cancel</Link>
          </Button>
        )}
        <Button className="w-full" disabled={pending} type="submit">
          {organization ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
