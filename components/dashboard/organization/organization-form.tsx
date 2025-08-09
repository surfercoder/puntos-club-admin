"use client";

import { useActionState, useState, useEffect } from 'react';
import { organizationFormAction } from '@/actions/dashboard/organization/organization-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Organization } from '@/types/organization';
import { OrganizationSchema } from '@/schemas/organization.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrganizationFormProps {
  organization?: Organization;
}

export default function OrganizationForm({ organization }: OrganizationFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(organizationFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/organization");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      OrganizationSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {organization?.id && <input type="hidden" name="id" value={organization.id} />}
      
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={organization?.name ?? ''}
          placeholder="Enter organization name"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="business_name">Business Name</Label>
        <Input
          id="business_name"
          name="business_name"
          type="text"
          defaultValue={organization?.business_name ?? ''}
          placeholder="Enter business name (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="business_name" />
      </div>

      <div>
        <Label htmlFor="tax_id">Tax ID</Label>
        <Input
          id="tax_id"
          name="tax_id"
          type="text"
          defaultValue={organization?.tax_id ?? ''}
          placeholder="Enter tax ID (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="tax_id" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/organization">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {organization ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
