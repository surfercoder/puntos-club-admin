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

type AddressTextFieldName = 'street' | 'number' | 'city' | 'state' | 'zip_code';

function AddressTextField({
  name,
  label,
  value,
  onChange,
  actionState,
}: {
  name: AddressTextFieldName;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  actionState: ActionState;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        aria-describedby={`${name}-error`}
        aria-invalid={!!actionState.fieldErrors?.[name]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        id={name}
        name={name}
      />
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}

function AddressHiddenFields({ addressData }: { addressData: Partial<GoogleAddressComponents> }) {
  return (
    <>
      {addressData.country && (
        <input type="hidden" name="country" value={addressData.country} />
      )}
      {addressData.place_id && (
        <input type="hidden" name="place_id" value={addressData.place_id} />
      )}
      {addressData.latitude !== undefined && (
        <input type="hidden" name="latitude" value={addressData.latitude} />
      )}
      {addressData.longitude !== undefined && (
        <input type="hidden" name="longitude" value={addressData.longitude} />
      )}
    </>
  );
}

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
  const currentActionState = validation ?? actionState;

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
    if (actionState.status === 'success') {
      toast.success(actionState.message);
      redirect("/dashboard/address");
    }
  }, [actionState]);

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

  const updateAddressField = (field: AddressTextFieldName) => (value: string) => {
    setAddressData((prev) => ({ ...prev, [field]: value }));
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
      <AddressTextField
        actionState={currentActionState}
        label={t('form.street')}
        name="street"
        onChange={updateAddressField('street')}
        value={addressData.street}
      />
      <AddressTextField
        actionState={currentActionState}
        label={t('form.number')}
        name="number"
        onChange={updateAddressField('number')}
        value={addressData.number}
      />
      <AddressTextField
        actionState={currentActionState}
        label={t('form.city')}
        name="city"
        onChange={updateAddressField('city')}
        value={addressData.city}
      />
      <AddressTextField
        actionState={currentActionState}
        label={t('form.state')}
        name="state"
        onChange={updateAddressField('state')}
        value={addressData.state}
      />
      <AddressTextField
        actionState={currentActionState}
        label={t('form.zipCode')}
        name="zip_code"
        onChange={updateAddressField('zip_code')}
        value={addressData.zip_code}
      />
      <AddressHiddenFields addressData={addressData} />
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
