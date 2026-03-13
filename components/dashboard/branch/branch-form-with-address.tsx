"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Dashboard.branch.form');
  const tCommon = useTranslations('Common');
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

  const router = useRouter();

  const wrappedAction = async (state: ActionState, formData: FormData) => {
    const result = await branchWithAddressFormAction(state, formData);
    if (result.status === 'success') {
      toast.success(result.message);
      setTimeout(() => router.push("/dashboard/branch"), 500);
    } else if (result.status === 'error' && result.message) {
      toast.error(result.message);
    }
    return result;
  };

  const [actionState, formAction, pending] = useActionState(wrappedAction, EMPTY_ACTION_STATE);

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
        <h3 className="text-lg font-semibold">{t('branchInfo')}</h3>
        
        <div>
          <Label htmlFor="name">{t('nameLabel')}</Label>
          <Input
            defaultValue={branch?.name ?? ''}
            id="name"
            name="name"
            placeholder={t('namePlaceholder')}
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="name" />
        </div>

        <div>
          <Label htmlFor="phone">{t('phoneLabel')}</Label>
          <Input
            defaultValue={branch?.phone ?? ''}
            id="phone"
            name="phone"
            placeholder={t('phonePlaceholder')}
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="phone" />
        </div>

        <input name="active" type="hidden" value={isActive.toString()} />
        
        <div>
          <Label htmlFor="active">{t('statusLabel')}</Label>
          <select
            id="active"
            value={isActive ? 'true' : 'false'}
            onChange={(e) => setIsActive(e.target.value === 'true')}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby="active-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.active}
          >
            <option value="true">{t('active')}</option>
            <option value="false">{t('inactive')}</option>
          </select>
          <FieldError actionState={validation ?? actionState} name="active" />
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">{t('addressInfo')}</h3>
        
        <div className="space-y-2">
          <Label htmlFor="google-address">{t('addressLabel')}</Label>
          <GoogleAddressAutocomplete
            onPlaceSelected={handlePlaceSelected}
            placeholder={t('addressPlaceholder')}
            id="google-address"
          />
          <p className="text-xs text-muted-foreground">{t('addressHint')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">{t('street')}</Label>
          <Input
            aria-describedby="street-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.street}
            value={addressData.street}
            onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
            id="street"
            name="street"
            placeholder={t('streetPlaceholder')}
          />
          <FieldError actionState={validation ?? actionState} name="street" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">{t('number')}</Label>
          <Input
            aria-describedby="number-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.number}
            value={addressData.number}
            onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
            id="number"
            name="number"
            placeholder={t('numberPlaceholder')}
          />
          <FieldError actionState={validation ?? actionState} name="number" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t('city')}</Label>
          <Input
            aria-describedby="city-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.city}
            value={addressData.city}
            onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
            id="city"
            name="city"
            placeholder={t('cityPlaceholder')}
          />
          <FieldError actionState={validation ?? actionState} name="city" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">{t('state')}</Label>
          <Input
            aria-describedby="state-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.state}
            value={addressData.state}
            onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
            id="state"
            name="state"
            placeholder={t('statePlaceholder')}
          />
          <FieldError actionState={validation ?? actionState} name="state" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip_code">{t('zipCode')}</Label>
          <Input
            aria-describedby="zip_code-error"
            aria-invalid={!!((validation ?? actionState).fieldErrors as Record<string, string[]> | undefined)?.zip_code}
            value={addressData.zip_code}
            onChange={(e) => setAddressData({ ...addressData, zip_code: e.target.value })}
            id="zip_code"
            name="zip_code"
            placeholder={t('zipCodePlaceholder')}
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
          <Link href="/dashboard/branch">{tCommon('cancel')}</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {branch ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}
