'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState , useEffect } from 'react';
import { toast } from "sonner"

import { addressFormAction } from '@/actions/dashboard/address/address-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { AddressSchema } from '@/schemas/address.schema';
import type { Address } from '@/types/address';


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
      {address?.id && <input name="id" type="hidden" value={String(address.id)} />}
      <div className="space-y-2">
        <Label htmlFor="street">Street</Label>
        <Input
          aria-describedby="street-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.street}
          defaultValue={address?.street ?? ''}
          id="street"
          name="street"
        />
        <FieldError actionState={validation ?? actionState} name="street" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">Number</Label>
        <Input
          aria-describedby="number-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.number}
          defaultValue={address?.number ?? ''}
          id="number"
          name="number"
        />
        <FieldError actionState={validation ?? actionState} name="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          aria-describedby="city-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.city}
          defaultValue={address?.city ?? ''}
          id="city"
          name="city"
        />
        <FieldError actionState={validation ?? actionState} name="city" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input
          aria-describedby="state-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.state}
          defaultValue={address?.state ?? ''}
          id="state"
          name="state"
        />
        <FieldError actionState={validation ?? actionState} name="state" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zip_code">Zip Code</Label>
        <Input
          aria-describedby="zip_code-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.zip_code}
          defaultValue={address?.zip_code ?? ''}
          id="zip_code"
          name="zip_code"
        />
        <FieldError actionState={validation ?? actionState} name="zip_code" />
      </div>
      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/address">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {address ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}