"use client";

import { MapPin, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
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
  const [locating, setLocating] = useState(false);
  const [addressData, setAddressData] = useState<Partial<GoogleAddressComponents>>({
    street: '',
    number: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  });

  const { push } = useRouter();

  const wrappedAction = async (state: ActionState, formData: FormData) => {
    const result = await branchWithAddressFormAction(state, formData);
    if (result.status === 'success') {
      toast.success(result.message);
      setTimeout(() => push("/dashboard/branch"), 500);
    } else if (result.status === 'error' && result.message) {
      toast.error(result.message);
    }
    return result;
  };

  const [actionState, formAction, pending] = useActionState(wrappedAction, EMPTY_ACTION_STATE);

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

  // "Usar mi ubicación": geolocalizamos y traducimos las coordenadas a una
  // dirección con el mismo Google Maps que ya usa el autocomplete.
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('locationError'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { importLibrary } = await import('@googlemaps/js-api-loader');
          const { Geocoder } = (await importLibrary('geocoding')) as google.maps.GeocodingLibrary;
          const { results } = await new Geocoder().geocode({
            location: { lat: coords.latitude, lng: coords.longitude },
          });
          const place = results[0];
          // Sin resultado no hay nada que completar: avisamos en vez de dejar
          // el formulario igual que antes del click.
          if (!place) {
            toast.error(t('locationError'));
            return;
          }
          const part = (type: string) =>
            place.address_components.find((c) => c.types.includes(type))?.long_name ?? '';
          setAddressData({
            street: part('route'),
            number: part('street_number'),
            city: part('locality') || part('administrative_area_level_2'),
            state: part('administrative_area_level_1'),
            zip_code: part('postal_code'),
            country: part('country'),
            place_id: place.place_id,
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        } catch {
          toast.error(t('locationError'));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error(t('locationError'));
      },
    );
  };

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

      <AddressSection
        actionState={validation ?? actionState}
        addressData={addressData}
        locating={locating}
        onPlaceSelected={handlePlaceSelected}
        onUseMyLocation={handleUseMyLocation}
        setAddressData={setAddressData}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/branch">{tCommon('cancel')}</Link>
        </Button>
        <Button className="brand-cta" disabled={pending} type="submit">
          <Save className="size-4" />
          {branch ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}

/**
 * Sección de dirección: buscador de Google, los campos editables a mano y los
 * datos geo que viajan ocultos en el form.
 */
function AddressSection({
  actionState,
  addressData,
  locating,
  onPlaceSelected,
  onUseMyLocation,
  setAddressData,
}: {
  actionState: ActionState;
  addressData: Partial<GoogleAddressComponents>;
  locating: boolean;
  onPlaceSelected: (components: GoogleAddressComponents) => void;
  onUseMyLocation: () => void;
  setAddressData: React.Dispatch<React.SetStateAction<Partial<GoogleAddressComponents>>>;
}) {
  const t = useTranslations('Dashboard.branch.form');
  const fieldErrors = actionState.fieldErrors as Record<string, string[]> | undefined;

  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-lg font-semibold">{t('addressInfo')}</h3>

      <div className="space-y-2">
        <Label htmlFor="google-address">{t('addressLabel')}</Label>
        <GoogleAddressAutocomplete
          onPlaceSelected={onPlaceSelected}
          placeholder={t('addressPlaceholder')}
          id="google-address"
        />
        <button
          className="mt-2 inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
          disabled={locating}
          onClick={onUseMyLocation}
          type="button"
        >
          <MapPin className="size-4 text-brand-violet" />
          {locating ? t('locating') : t('useMyLocation')}
        </button>
        <p className="text-xs text-muted-foreground">{t('addressHint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="street">{t('street')}</Label>
          <Input
            aria-describedby="street-error"
            aria-invalid={!!fieldErrors?.street}
            value={addressData.street}
            onChange={(e) => setAddressData((prev) => ({ ...prev, street: e.target.value }))}
            id="street"
            name="street"
            placeholder={t('streetPlaceholder')}
          />
          <FieldError actionState={actionState} name="street" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="number">{t('number')}</Label>
          <Input
            aria-describedby="number-error"
            aria-invalid={!!fieldErrors?.number}
            value={addressData.number}
            onChange={(e) => setAddressData((prev) => ({ ...prev, number: e.target.value }))}
            id="number"
            name="number"
            placeholder={t('numberPlaceholder')}
          />
          <FieldError actionState={actionState} name="number" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">{t('city')}</Label>
          <Input
            aria-describedby="city-error"
            aria-invalid={!!fieldErrors?.city}
            value={addressData.city}
            onChange={(e) => setAddressData((prev) => ({ ...prev, city: e.target.value }))}
            id="city"
            name="city"
            placeholder={t('cityPlaceholder')}
          />
          <FieldError actionState={actionState} name="city" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">{t('state')}</Label>
          <Input
            aria-describedby="state-error"
            aria-invalid={!!fieldErrors?.state}
            value={addressData.state}
            onChange={(e) => setAddressData((prev) => ({ ...prev, state: e.target.value }))}
            id="state"
            name="state"
            placeholder={t('statePlaceholder')}
          />
          <FieldError actionState={actionState} name="state" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip_code">{t('zipCode')}</Label>
        <Input
          aria-describedby="zip_code-error"
          aria-invalid={!!fieldErrors?.zip_code}
          value={addressData.zip_code}
          onChange={(e) => setAddressData((prev) => ({ ...prev, zip_code: e.target.value }))}
          id="zip_code"
          name="zip_code"
          placeholder={t('zipCodePlaceholder')}
        />
        <FieldError actionState={actionState} name="zip_code" />
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
  );
}
