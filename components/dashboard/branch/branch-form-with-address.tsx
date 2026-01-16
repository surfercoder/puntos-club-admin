"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";

import { branchWithAddressFormAction } from '@/actions/dashboard/branch/branch-with-address-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleAddressAutocomplete, type GoogleAddressComponents } from '@/components/ui/google-address-autocomplete';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { BranchSchema } from '@/schemas/branch.schema';
import { AddressSchema } from '@/schemas/address.schema';
import type { Branch } from '@/types/branch';

interface BranchFormWithAddressProps {
  branch?: Branch;
}

export default function BranchFormWithAddress({ branch }: BranchFormWithAddressProps) {
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [isActive, setIsActive] = useState<boolean>(branch?.active ?? true);
  const [addressData, setAddressData] = useState<Partial<GoogleAddressComponents>>({
    street: '',
    number: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  });

  const [actionState, formAction, pending] = useActionState(branchWithAddressFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/branch");
      }, 500);
    }
  }, [actionState, router]);

  const handlePlaceSelected = useCallback((components: GoogleAddressComponents) => {
    setAddressData({
      street: components.street,
      number: components.number,
      city: components.city,
      state: components.state,
      zip_code: components.zip_code,
      country: components.country,
      place_id: components.place_id,
      latitude: components.latitude,
      longitude: components.longitude,
    });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const formDataObj = Object.fromEntries(formData);
    setValidation(null);

    try {
      const addressFields = {
        street: formDataObj.street,
        number: formDataObj.number,
        city: formDataObj.city,
        state: formDataObj.state,
        zip_code: formDataObj.zip_code,
        country: formDataObj.country,
      };
      AddressSchema.parse(addressFields);

      const branchFields = {
        name: formDataObj.name,
        phone: formDataObj.phone || null,
        active: formDataObj.active,
        address_id: 'temp',
      };
      BranchSchema.parse(branchFields);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-6" onSubmit={handleSubmit}>
      {branch?.id && <input name="id" type="hidden" value={branch.id} />}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Branch Information</h3>
        
        <div>
          <Label htmlFor="name">Branch Name</Label>
          <Input
            defaultValue={branch?.name ?? ''}
            id="name"
            name="name"
            placeholder="Enter branch name"
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="name" />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            defaultValue={branch?.phone ?? ''}
            id="phone"
            name="phone"
            placeholder="Enter phone number (optional)"
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="phone" />
        </div>

        <input name="active" type="hidden" value={isActive.toString()} />
        
        <div>
          <Label htmlFor="active">Status</Label>
          <select
            id="active"
            value={isActive ? 'true' : 'false'}
            onChange={(e) => setIsActive(e.target.value === 'true')}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby="active-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.active}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <FieldError actionState={validation ?? actionState} name="active" />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Address Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="google-address">Search Address</Label>
          <GoogleAddressAutocomplete
            onPlaceSelected={handlePlaceSelected}
            placeholder="Start typing an address..."
            id="google-address"
          />
          <p className="text-xs text-muted-foreground">Select an address from Google suggestions or fill manually below</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Street</Label>
          <Input
            aria-describedby="street-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.street}
            value={addressData.street}
            onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
            id="street"
            name="street"
            placeholder="Street name"
          />
          <FieldError actionState={validation ?? actionState} name="street" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">Number</Label>
          <Input
            aria-describedby="number-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.number}
            value={addressData.number}
            onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
            id="number"
            name="number"
            placeholder="Street number"
          />
          <FieldError actionState={validation ?? actionState} name="number" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            aria-describedby="city-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.city}
            value={addressData.city}
            onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
            id="city"
            name="city"
            placeholder="City"
          />
          <FieldError actionState={validation ?? actionState} name="city" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            aria-describedby="state-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.state}
            value={addressData.state}
            onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
            id="state"
            name="state"
            placeholder="State/Province"
          />
          <FieldError actionState={validation ?? actionState} name="state" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip_code">Zip Code</Label>
          <Input
            aria-describedby="zip_code-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.zip_code}
            value={addressData.zip_code}
            onChange={(e) => setAddressData({ ...addressData, zip_code: e.target.value })}
            id="zip_code"
            name="zip_code"
            placeholder="Postal code"
          />
          <FieldError actionState={validation ?? actionState} name="zip_code" />
        </div>

        {addressData.country && (
          <input type="hidden" name="country" value={addressData.country} />
        )}
        {addressData.place_id && (
          <input type="hidden" name="place_id" value={addressData.place_id} />
        )}
        {addressData.latitude && (
          <input type="hidden" name="latitude" value={addressData.latitude} />
        )}
        {addressData.longitude && (
          <input type="hidden" name="longitude" value={addressData.longitude} />
        )}
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/branch">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {branch ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
