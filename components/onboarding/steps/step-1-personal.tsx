'use client';

import { useReducer } from 'react';
import Link from 'next/link';
import { BadgeCheck, Eye, EyeOff, Loader2, Mail, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { initiateRegistration } from '@/actions/onboarding/initiate-registration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Step1CompletedData } from '@/components/onboarding/onboarding-wizard';

interface Step1Props {
  onNext: (data?: Step1CompletedData) => void;
  /** Present when the user has already verified their email. Renders a read-only summary. */
  completedData?: Step1CompletedData | null;
}

// ─── Completed / read-only view ─────────────────────────────────────────────

function Step1CompletedView({
  data,
  onNext,
}: {
  data: Step1CompletedData;
  onNext: () => void;
}) {
  const t = useTranslations('Onboarding.step1');
  const initials = [data.firstName[0], data.lastName[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Verified banner */}
      <div className="flex items-center gap-3 rounded-xl border border-brand-green/30 bg-brand-green/10 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-brand-green" />
        <div>
          <p className="text-sm font-semibold text-brand-green dark:text-brand-green">
            {t('emailVerified')}
          </p>
          <p className="text-xs text-brand-green/80">
            {t('emailVerifiedMessage')}
          </p>
        </div>
      </div>

      {/* User card */}
      <div className="rounded-xl border bg-muted/50 p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-sm">
            {initials || <User className="h-6 w-6" />}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-foreground truncate">
                {data.firstName} {data.lastName}
              </p>
              <BadgeCheck className="h-4 w-4 shrink-0 text-brand-green" />
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{data.email}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t('needDifferentEmail')}{' '}
        <Link href="/auth/login" className="underline hover:text-foreground">
          {t('useDifferentEmail')}
        </Link>
      </p>

      <Button
        type="button"
        className="w-full"
        onClick={onNext}
      >
        {t('continueSetup')}
      </Button>
    </div>
  );
}

// ─── Registration form view ──────────────────────────────────────────────────

interface Step1FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  emailSent: boolean;
  errors: Record<string, string>;
}

type Step1FormAction =
  | { type: 'SET_FIELD'; field: 'firstName' | 'lastName' | 'email' | 'password'; value: string }
  | { type: 'TOGGLE_SHOW_PASSWORD' }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_EMAIL_SENT'; value: boolean }
  | { type: 'SET_ERRORS'; value: Record<string, string> };

const step1FormInitialState: Step1FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  showPassword: false,
  loading: false,
  emailSent: false,
  errors: {},
};

function step1FormReducer(state: Step1FormState, action: Step1FormAction): Step1FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_SHOW_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_EMAIL_SENT':
      return { ...state, emailSent: action.value };
    case 'SET_ERRORS':
      return { ...state, errors: action.value };
    default:
      return state;
  }
}

function Step1FormView({ onNext: _onNext }: { onNext: (data: Step1CompletedData) => void }) {
  const t = useTranslations('Onboarding.step1');
  const tCommon = useTranslations('Common');
  const [state, dispatch] = useReducer(step1FormReducer, step1FormInitialState);
  const { firstName, lastName, email, password, showPassword, loading, emailSent, errors } = state;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!email.trim()) newErrors.email = tCommon('email');
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = tCommon('email');
    if (!password) newErrors.password = tCommon('password');
    else if (password.length < 8) newErrors.password = t('minPassword');
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'SET_ERRORS', value: validationErrors });
      return;
    }
    dispatch({ type: 'SET_ERRORS', value: {} });
    dispatch({ type: 'SET_LOADING', value: true });

    const result = await initiateRegistration({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
      redirectTo: '/owner/onboarding?step=2',
    });

    dispatch({ type: 'SET_LOADING', value: false });

    if (!result.success) {
      toast.error(result.error || t('genericError'));
      return;
    }

    // Store in localStorage so the completed view can hydrate from it
    localStorage.setItem('onboarding_first_name', firstName.trim());
    localStorage.setItem('onboarding_last_name', lastName.trim());
    localStorage.setItem('onboarding_email', email.trim());

    dispatch({ type: 'SET_EMAIL_SENT', value: true });
  };

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t('checkEmail')}
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {t('confirmationSent')}{' '}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>
        <div className="rounded-lg border border-brand-orange/30 bg-brand-orange/10 p-4 text-sm text-brand-orange max-w-sm">
          <p className="font-medium mb-1">{t('noEmailReceived')}</p>
          <p>{t('spamNote')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'SET_EMAIL_SENT', value: false })}
          className="text-sm"
        >
          {t('useDifferentEmail')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{tCommon('name')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              placeholder="Juan"
              className="pl-9"
              value={firstName}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'firstName', value: e.target.value })}
              disabled={loading}
            />
          </div>
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{tCommon('lastName')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              placeholder="García"
              className="pl-9"
              value={lastName}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'lastName', value: e.target.value })}
              disabled={loading}
            />
          </div>
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="juan@minegocio.com"
            className="pl-9"
            value={email}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
            disabled={loading}
            autoComplete="email"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{tCommon('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('minPassword')}
            value={password}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
            disabled={loading}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => dispatch({ type: 'TOGGLE_SHOW_PASSWORD' })}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        <p className="text-xs text-muted-foreground">
          {t('passwordHint')}
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('creating')}
          </>
        ) : (
          t('submitButton')
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t('termsNote')}
      </p>
    </form>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export function Step1Personal({ onNext, completedData }: Step1Props) {
  if (completedData) {
    return (
      <Step1CompletedView
        data={completedData}
        onNext={() => onNext()}
      />
    );
  }

  return <Step1FormView onNext={(data) => onNext(data)} />;
}
