"use client";

import { useActionState, useState, useEffect } from 'react';
import { beneficiaryFormAction } from '@/actions/dashboard/beneficiary/beneficiary-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Beneficiary } from '@/types/beneficiary';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary;
}

export default function BeneficiaryForm({ beneficiary }: BeneficiaryFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(beneficiaryFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/beneficiary");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

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
      {beneficiary?.id && <input type="hidden" name="id" value={beneficiary.id} />}
      <div>
        <Label htmlFor="first_name">First Name</Label>
        <Input
          id="first_name"
          name="first_name"
          type="text"
          defaultValue={beneficiary?.first_name ?? ''}
          placeholder="Enter first name"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
          aria-describedby="first_name-error"
        />
        <FieldError actionState={validation ?? actionState} name="first_name" />
      </div>

      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          name="last_name"
          type="text"
          defaultValue={beneficiary?.last_name ?? ''}
          placeholder="Enter last name"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
          aria-describedby="last_name-error"
        />
        <FieldError actionState={validation ?? actionState} name="last_name" />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={beneficiary?.email ?? ''}
          placeholder="Enter email address"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          aria-describedby="email-error"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={beneficiary?.phone ?? ''}
          placeholder="Enter phone number"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.phone}
          aria-describedby="phone-error"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="document_id">Document ID</Label>
        <Input
          id="document_id"
          name="document_id"
          type="text"
          defaultValue={beneficiary?.document_id ?? ''}
          placeholder="Enter document ID"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.document_id}
          aria-describedby="document_id-error"
        />
        <FieldError actionState={validation ?? actionState} name="document_id" />
      </div>

      <div>
        <Label htmlFor="available_points">Available Points</Label>
        <Input
          id="available_points"
          name="available_points"
          type="number"
          min="0"
          step="1"
          defaultValue={beneficiary?.available_points ?? 0}
          placeholder="Enter available points"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.available_points}
          aria-describedby="available_points-error"
        />
        <FieldError actionState={validation ?? actionState} name="available_points" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/beneficiary">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {beneficiary ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
