'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState , useEffect } from 'react';
import { toast } from "sonner"

import { addressFormAction } from '@/actions/dashboard/address/address-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleAddressAutocomplete, type GoogleAddressComponents } from '@/components/ui/google-address-autocomplete';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { AddressSchema } from '@/schemas/address.schema';
import type { Address } from '@/types/address';


export default function AddressForm({ address }: { address?: Address }) {
  const t = useTranslations('Dashboard.address');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [addressData, setAddressData] = useState<Partial<GoogleAddressComponents>>({
    street: address?.street ?? '',
    number: address?.number ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    zip_code: address?.zip_code ?? '',
    country: address?.country ?? '',
  });

  // Utils
  const [actionState, formAction, pending] = useActionState(addressFormAction, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState])

  if (actionState.status === 'success') {
    toast.success(actionState.message)
    redirect("/dashboard/address")
  }

  // Handlers
  const handlePlaceSelected = (components: GoogleAddressComponents) => {
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
  };

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
        <Label htmlFor="google-address">{t('form.searchAddress')}</Label>
        <GoogleAddressAutocomplete
          onPlaceSelected={handlePlaceSelected}
          placeholder={t('form.searchPlaceholder')}
          id="google-address"
        />
        <p className="text-xs text-muted-foreground">{t('form.searchHint')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="street">{t('form.street')}</Label>
        <Input
          aria-describedby="street-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.street}
          value={addressData.street}
          onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
          id="street"
          name="street"
        />
        <FieldError actionState={validation ?? actionState} name="street" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="number">{t('form.number')}</Label>
        <Input
          aria-describedby="number-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.number}
          value={addressData.number}
          onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
          id="number"
          name="number"
        />
        <FieldError actionState={validation ?? actionState} name="number" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">{t('form.city')}</Label>
        <Input
          aria-describedby="city-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.city}
          value={addressData.city}
          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
          id="city"
          name="city"
        />
        <FieldError actionState={validation ?? actionState} name="city" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">{t('form.state')}</Label>
        <Input
          aria-describedby="state-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.state}
          value={addressData.state}
          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
          id="state"
          name="state"
        />
        <FieldError actionState={validation ?? actionState} name="state" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zip_code">{t('form.zipCode')}</Label>
        <Input
          aria-describedby="zip_code-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.zip_code}
          value={addressData.zip_code}
          onChange={(e) => setAddressData({ ...addressData, zip_code: e.target.value })}
          id="zip_code"
          name="zip_code"
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
      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/address">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {address ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}