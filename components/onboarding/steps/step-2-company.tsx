'use client';

import { useReducer } from 'react';
import { Building2, ChevronDown, ChevronUp, Eye, EyeOff, Info, Phone, Store, UserCog } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { GoogleAddressAutocomplete } from '@/components/ui/google-address-autocomplete';
import type { GoogleAddressComponents } from '@/components/ui/google-address-autocomplete';
import type { OnboardingStep2Data } from '@/actions/onboarding/actions';

// ── State & Reducer ──────────────────────────────────────────────────────────

interface Step2State {
  orgName: string;
  businessName: string;
  taxId: string;
  logoUrl: string | null;
  branchName: string;
  branchPhone: string;
  address: GoogleAddressComponents | null;
  showCashier: boolean;
  cashierFirstName: string;
  cashierLastName: string;
  cashierEmail: string;
  cashierPassword: string;
  cashierConfirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  errors: Record<string, string>;
}

type Step2Action =
  | { type: 'SET_FIELD'; field: keyof Step2State; value: Step2State[keyof Step2State] }
  | { type: 'TOGGLE'; field: 'showCashier' | 'showPassword' | 'showConfirmPassword' }
  | { type: 'SET_ERRORS'; errors: Record<string, string> };

function reducer(state: Step2State, action: Step2Action): Step2State {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE':
      return { ...state, [action.field]: !state[action.field] };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
  }
}

function buildInitialState(initialData?: OnboardingStep2Data | null): Step2State {
  return {
    orgName: initialData?.org.name ?? '',
    businessName: initialData?.org.business_name ?? '',
    taxId: initialData?.org.tax_id ?? '',
    logoUrl: initialData?.org.logo_url ?? null,
    branchName: initialData?.branch.name ?? '',
    branchPhone: initialData?.branch.phone ?? '',
    address: initialData?.address
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
      : null,
    showCashier: !!initialData?.cashier,
    cashierFirstName: initialData?.cashier?.first_name ?? '',
    cashierLastName: initialData?.cashier?.last_name ?? '',
    cashierEmail: initialData?.cashier?.email ?? '',
    cashierPassword: initialData?.cashier?.password ?? '',
    cashierConfirmPassword: initialData?.cashier?.password ?? '',
    showPassword: false,
    showConfirmPassword: false,
    errors: {},
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface AddressSectionProps {
  state: Step2State;
  dispatch: React.Dispatch<Step2Action>;
  t: ReturnType<typeof useTranslations>;
}

function AddressSection({ state, dispatch, t }: AddressSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="address">
        {t('branchAddress')} <span className="text-destructive">*</span>
      </Label>
      <GoogleAddressAutocomplete
        id="address"
        placeholder={t('addressPlaceholder')}
        defaultValue={state.address?.formatted_address ?? ''}
        onPlaceSelected={(place) => dispatch({ type: 'SET_FIELD', field: 'address', value: place })}
      />
      {state.errors.address && <p className="text-xs text-destructive">{state.errors.address}</p>}
      {state.address && (
        <div className="rounded-md bg-brand-green/10 border border-brand-green/30 px-3 py-2 text-sm text-brand-green">
          📍 {state.address.formatted_address}
        </div>
      )}
      <div className="flex items-start gap-2 rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-xs text-primary">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{t('firstBranchHint')}</span>
      </div>
    </div>
  );
}

interface CashierSectionProps {
  state: Step2State;
  dispatch: React.Dispatch<Step2Action>;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}

function CashierSection({ state, dispatch, t, tCommon }: CashierSectionProps) {
  const setText = (field: keyof Step2State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });

  return (
    <div className="rounded-xl border border-dashed border-border overflow-hidden">
      <button
        type="button"
        onClick={() => dispatch({ type: 'TOGGLE', field: 'showCashier' })}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-pink/10">
            <UserCog className="h-4 w-4 text-brand-pink" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('createCashier')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('cashierOptional')}
            </p>
          </div>
        </div>
        {state.showCashier ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {state.showCashier && (
        <div className="border-t border-dashed border-border px-4 py-4 space-y-4 bg-muted/30">
          <div className="flex items-start gap-2 rounded-md bg-brand-pink/10 border border-brand-pink/30 px-3 py-2 text-xs text-brand-pink">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t('cashierHint')}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cashierFirstName">{tCommon('name')}</Label>
              <Input
                id="cashierFirstName"
                placeholder={t('cashierFirstNamePlaceholder')}
                value={state.cashierFirstName}
                onChange={setText('cashierFirstName')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cashierLastName">{tCommon('lastName')}</Label>
              <Input
                id="cashierLastName"
                placeholder={t('cashierLastNamePlaceholder')}
                value={state.cashierLastName}
                onChange={setText('cashierLastName')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cashierEmail">
              {t('cashierEmail')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cashierEmail"
              type="email"
              placeholder={t('cashierEmailPlaceholder')}
              value={state.cashierEmail}
              onChange={setText('cashierEmail')}
            />
            {state.errors.cashierEmail && (
              <p className="text-xs text-destructive">{state.errors.cashierEmail}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cashierPassword">
                {tCommon('password')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cashierPassword"
                  type={state.showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  className="pr-9"
                  value={state.cashierPassword}
                  onChange={setText('cashierPassword')}
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'TOGGLE', field: 'showPassword' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {state.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {state.errors.cashierPassword && (
                <p className="text-xs text-destructive">{state.errors.cashierPassword}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cashierConfirmPassword">
                {t('confirmPassword')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cashierConfirmPassword"
                  type={state.showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className="pr-9"
                  value={state.cashierConfirmPassword}
                  onChange={setText('cashierConfirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'TOGGLE', field: 'showConfirmPassword' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {state.showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {state.errors.cashierConfirmPassword && (
                <p className="text-xs text-destructive">{state.errors.cashierConfirmPassword}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Step2Props {
  onNext: (data: OnboardingStep2Data) => void;
  onBack: () => void;
  initialData?: OnboardingStep2Data | null;
}

export function Step2Company({ onNext, onBack, initialData }: Step2Props) {
  const t = useTranslations('Onboarding.step2');
  const tCommon = useTranslations('Common');
  const [state, dispatch] = useReducer(reducer, initialData, buildInitialState);

  const setText = (field: keyof Step2State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });

  const cashierHasData =
    state.showCashier &&
    (state.cashierEmail || state.cashierPassword || state.cashierFirstName || state.cashierLastName);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!state.orgName.trim()) errs.orgName = t('validation.businessNameRequired');
    if (!state.branchName.trim()) errs.branchName = t('validation.branchNameRequired');
    if (!state.address) errs.address = t('validation.branchAddressRequired');
    if (cashierHasData) {
      if (!state.cashierEmail.trim()) errs.cashierEmail = t('validation.cashierEmailRequired');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.cashierEmail))
        errs.cashierEmail = t('validation.cashierEmailInvalid');
      if (!state.cashierPassword) errs.cashierPassword = t('validation.passwordRequired');
      else if (state.cashierPassword.length < 6)
        errs.cashierPassword = t('validation.passwordMinLength');
      if (state.cashierPassword !== state.cashierConfirmPassword)
        errs.cashierConfirmPassword = t('validation.passwordsMismatch');
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: validationErrors });
      return;
    }
    dispatch({ type: 'SET_ERRORS', errors: {} });

    onNext({
      org: {
        name: state.orgName.trim(),
        business_name: state.businessName.trim() || undefined,
        tax_id: state.taxId.trim() || undefined,
        logo_url: state.logoUrl || undefined,
      },
      address: {
        street: state.address!.street,
        number: state.address!.number,
        city: state.address!.city,
        state: state.address!.state,
        zip_code: state.address!.zip_code,
        country: state.address!.country,
        place_id: state.address!.place_id,
        latitude: state.address!.latitude,
        longitude: state.address!.longitude,
        formatted_address: state.address!.formatted_address,
      },
      branch: {
        name: state.branchName.trim(),
        phone: state.branchPhone.trim() || undefined,
      },
      cashier: cashierHasData
        ? {
            email: state.cashierEmail.trim(),
            password: state.cashierPassword,
            first_name: state.cashierFirstName.trim() || undefined,
            last_name: state.cashierLastName.trim() || undefined,
          }
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="orgName">
          {t('businessName')} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="orgName"
            placeholder={t('businessNamePlaceholder')}
            className="pl-9"
            value={state.orgName}
            onChange={setText('orgName')}
          />
        </div>
        {state.errors.orgName && <p className="text-xs text-destructive">{state.errors.orgName}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">{t('legalName')}</Label>
          <Input
            id="businessName"
            placeholder={t('legalNamePlaceholder')}
            value={state.businessName}
            onChange={setText('businessName')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxId">{t('taxId')}</Label>
          <Input
            id="taxId"
            placeholder={t('taxIdPlaceholder')}
            value={state.taxId}
            onChange={setText('taxId')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('businessLogo')}</Label>
        <ImageUpload
          value={state.logoUrl}
          onChange={(url) => dispatch({ type: 'SET_FIELD', field: 'logoUrl', value: url })}
          bucket="logos"
          path="organizations"
          maxSizeMB={2}
          aspectRatio="square"
          maxHeight={200}
        />
        <p className="text-xs text-muted-foreground">{t('logoHint')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branchName">
          {t('branchName')} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="branchName"
            placeholder={t('branchNamePlaceholder')}
            className="pl-9"
            value={state.branchName}
            onChange={setText('branchName')}
          />
        </div>
        {state.errors.branchName && <p className="text-xs text-destructive">{state.errors.branchName}</p>}
      </div>

      <AddressSection state={state} dispatch={dispatch} t={t} />

      <div className="space-y-2">
        <Label htmlFor="branchPhone">{t('branchPhone')}</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="branchPhone"
            type="tel"
            placeholder={t('branchPhonePlaceholder')}
            className="pl-9"
            value={state.branchPhone}
            onChange={setText('branchPhone')}
          />
        </div>
      </div>

      <CashierSection state={state} dispatch={dispatch} t={t} tCommon={tCommon} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          {tCommon('back')}
        </Button>
        <Button type="submit" className="flex-1">
          {tCommon('continue')}
        </Button>
      </div>
    </form>
  );
}
