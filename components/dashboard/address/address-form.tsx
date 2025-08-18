'use client';

import { useActionState, useState } from 'react';
import { Address } from '@/types/address';
import { addressFormAction } from '@/actions/dashboard/address/address-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { AddressSchema } from '@/schemas/address.schema';
import { toast } from "sonner"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AddressForm({ address }: { address?: Address }) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(addressFormAction, EMPTY_ACTION_STATE);
  const router = useRouter()

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message)
      setTimeout(() => {
        router.push("/dashboard/address")
      }, 500) // Show toast briefly before navigating
    }
  }, [actionState, router])

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      AddressSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  // Render
  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {address?.id && <input type="hidden" name="id" value={String(address.id)} />}
      <div className="space-y-2">
        <Label htmlFor="street">Street</Label>
        <Input
          id="street"
          name="street"
          defaultValue={address?.street ?? ''}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.street}
          aria-describedby="street-error"
        />
        <FieldError actionState={validation ?? actionState} name="street" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Number</Label>
        <Input
          id="number"
          name="number"
          defaultValue={address?.number ?? ''}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.number}
          aria-describedby="number-error"
        />
        <FieldError actionState={validation ?? actionState} name="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          defaultValue={address?.city ?? ''}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.city}
          aria-describedby="city-error"
        />
        <FieldError actionState={validation ?? actionState} name="city" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input
          id="state"
          name="state"
          defaultValue={address?.state ?? ''}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.state}
          aria-describedby="state-error"
        />
        <FieldError actionState={validation ?? actionState} name="state" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zip_code">Zip Code</Label>
        <Input
          id="zip_code"
          name="zip_code"
          defaultValue={address?.zip_code ?? ''}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.zip_code}
          aria-describedby="zip_code-error"
        />
        <FieldError actionState={validation ?? actionState} name="zip_code" />
      </div>
      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/address">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {address ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}