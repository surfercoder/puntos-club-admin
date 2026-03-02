'use client';

import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Eye, EyeOff, Info, Phone, Store, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { GoogleAddressAutocomplete } from '@/components/ui/google-address-autocomplete';
import type { GoogleAddressComponents } from '@/components/ui/google-address-autocomplete';
import type { OnboardingStep2Data } from '@/actions/onboarding/actions';

interface Step2Props {
  onNext: (data: OnboardingStep2Data) => void;
  onBack: () => void;
  initialData?: OnboardingStep2Data | null;
}

export function Step2Company({ onNext, onBack, initialData }: Step2Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.org.logo_url ?? null);
  const [address, setAddress] = useState<GoogleAddressComponents | null>(
    initialData?.address
      ? {
          street: initialData.address.street,
          number: initialData.address.number,
          city: initialData.address.city,
          state: initialData.address.state,
          zip_code: initialData.address.zip_code,
          country: initialData.address.country ?? '',
          formatted_address: initialData.address.formatted_address ?? '',
          place_id: initialData.address.place_id ?? '',
          latitude: initialData.address.latitude,
          longitude: initialData.address.longitude,
        }
      : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [orgName, setOrgName] = useState(initialData?.org.name ?? '');
  const [businessName, setBusinessName] = useState(initialData?.org.business_name ?? '');
  const [taxId, setTaxId] = useState(initialData?.org.tax_id ?? '');
  const [branchName, setBranchName] = useState(initialData?.branch.name ?? '');
  const [branchPhone, setBranchPhone] = useState(initialData?.branch.phone ?? '');

  const [showCashier, setShowCashier] = useState(!!initialData?.cashier);
  const [cashierFirstName, setCashierFirstName] = useState(initialData?.cashier?.first_name ?? '');
  const [cashierLastName, setCashierLastName] = useState(initialData?.cashier?.last_name ?? '');
  const [cashierEmail, setCashierEmail] = useState(initialData?.cashier?.email ?? '');
  const [cashierPassword, setCashierPassword] = useState(initialData?.cashier?.password ?? '');
  const [cashierConfirmPassword, setCashierConfirmPassword] = useState(initialData?.cashier?.password ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const cashierHasData = showCashier && (cashierEmail || cashierPassword || cashierFirstName || cashierLastName);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!orgName.trim()) newErrors.orgName = 'El nombre del negocio es requerido';
    if (!branchName.trim()) newErrors.branchName = 'El nombre de la sucursal es requerido';
    if (!address) newErrors.address = 'La dirección de la sucursal es requerida';
    if (cashierHasData) {
      if (!cashierEmail.trim()) newErrors.cashierEmail = 'El email del cajero es requerido';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cashierEmail))
        newErrors.cashierEmail = 'El email no es válido';
      if (!cashierPassword) newErrors.cashierPassword = 'La contraseña es requerida';
      else if (cashierPassword.length < 6)
        newErrors.cashierPassword = 'La contraseña debe tener al menos 6 caracteres';
      if (cashierPassword !== cashierConfirmPassword)
        newErrors.cashierConfirmPassword = 'Las contraseñas no coinciden';
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    onNext({
      org: {
        name: orgName.trim(),
        business_name: businessName.trim() || undefined,
        tax_id: taxId.trim() || undefined,
        logo_url: logoUrl || undefined,
      },
      address: {
        street: address!.street,
        number: address!.number,
        city: address!.city,
        state: address!.state,
        zip_code: address!.zip_code,
        country: address!.country,
        place_id: address!.place_id,
        latitude: address!.latitude,
        longitude: address!.longitude,
        formatted_address: address!.formatted_address,
      },
      branch: {
        name: branchName.trim(),
        phone: branchPhone.trim() || undefined,
      },
      cashier: cashierHasData
        ? {
            email: cashierEmail.trim(),
            password: cashierPassword,
            first_name: cashierFirstName.trim() || undefined,
            last_name: cashierLastName.trim() || undefined,
          }
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="orgName">
          Nombre del negocio <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="orgName"
            placeholder="Ej: Café Central"
            className="pl-9"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        {errors.orgName && <p className="text-xs text-destructive">{errors.orgName}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Razón social</Label>
          <Input
            id="businessName"
            placeholder="Ej: Café Central S.A."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">CUIT / RUT / NIF</Label>
          <Input
            id="taxId"
            placeholder="Ej: 20-12345678-9"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Logo del negocio</Label>
        <ImageUpload
          value={logoUrl}
          onChange={setLogoUrl}
          bucket="logos"
          path="organizations"
          maxSizeMB={2}
          aspectRatio="square"
          maxHeight={200}
        />
        <p className="text-xs text-muted-foreground">
          PNG o JPG, máximo 2MB. Recomendamos una imagen cuadrada.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branchName">
          Nombre de la sucursal <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="branchName"
            placeholder="Ej: Sucursal Centro"
            className="pl-9"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </div>
        {errors.branchName && <p className="text-xs text-destructive">{errors.branchName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">
          Dirección de la primera sucursal <span className="text-destructive">*</span>
        </Label>
        <GoogleAddressAutocomplete
          id="address"
          placeholder="Buscar dirección..."
          defaultValue={address?.formatted_address ?? ''}
          onPlaceSelected={(place) => setAddress(place)}
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        {address && (
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            📍 {address.formatted_address}
          </div>
        )}
        <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Esta será tu primera sucursal. Podrás agregar más sucursales más adelante desde el
            panel de administración.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branchPhone">Teléfono de la sucursal</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="branchPhone"
            type="tel"
            placeholder="Ej: +54 11 1234-5678"
            className="pl-9"
            value={branchPhone}
            onChange={(e) => setBranchPhone(e.target.value)}
          />
        </div>
      </div>

      {/* Optional cashier section */}
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCashier((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
              <UserCog className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Crear primer cajero
              </p>
              <p className="text-xs text-muted-foreground">
                Opcional · Tu cajero podrá entrar a PuntosClubCaja de inmediato
              </p>
            </div>
          </div>
          {showCashier ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        {showCashier && (
          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 px-4 py-4 space-y-4 bg-gray-50/50 dark:bg-gray-800/20">
            <div className="flex items-start gap-2 rounded-md bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Se creará una cuenta para que el cajero pueda ingresar a la app{' '}
                <strong>PuntosClubCaja</strong> con estas credenciales. Podrás agregar más
                cajeros desde el panel de administración.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cashierFirstName">Nombre</Label>
                <Input
                  id="cashierFirstName"
                  placeholder="Ej: Juan"
                  value={cashierFirstName}
                  onChange={(e) => setCashierFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cashierLastName">Apellido</Label>
                <Input
                  id="cashierLastName"
                  placeholder="Ej: García"
                  value={cashierLastName}
                  onChange={(e) => setCashierLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cashierEmail">
                Email del cajero <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cashierEmail"
                type="email"
                placeholder="cajero@tunegocio.com"
                value={cashierEmail}
                onChange={(e) => setCashierEmail(e.target.value)}
              />
              {errors.cashierEmail && (
                <p className="text-xs text-destructive">{errors.cashierEmail}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cashierPassword">
                  Contraseña <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cashierPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-9"
                    value={cashierPassword}
                    onChange={(e) => setCashierPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.cashierPassword && (
                  <p className="text-xs text-destructive">{errors.cashierPassword}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cashierConfirmPassword">
                  Confirmar contraseña <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cashierConfirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    className="pr-9"
                    value={cashierConfirmPassword}
                    onChange={(e) => setCashierConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.cashierConfirmPassword && (
                  <p className="text-xs text-destructive">{errors.cashierConfirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Atrás
        </Button>
        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          Continuar
        </Button>
      </div>
    </form>
  );
}
