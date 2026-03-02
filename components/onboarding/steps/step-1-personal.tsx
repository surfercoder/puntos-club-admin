'use client';

import { useState } from 'react';
import { BadgeCheck, Eye, EyeOff, Loader2, Mail, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';

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
  const initials = [data.firstName[0], data.lastName[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Verified banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Email verificado
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Tu cuenta está activa y lista para continuar.
          </p>
        </div>
      </div>

      {/* User card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-lg font-bold shadow-sm">
            {initials || <User className="h-6 w-6" />}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {data.firstName} {data.lastName}
              </p>
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{data.email}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        ¿Necesitas usar otro email?{' '}
        <a href="/auth/login" className="underline hover:text-foreground">
          Inicia sesión con otra cuenta.
        </a>
      </p>

      <Button
        type="button"
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        onClick={onNext}
      >
        Continuar con la configuración
      </Button>
    </div>
  );
}

// ─── Registration form view ──────────────────────────────────────────────────

function Step1FormView({ onNext }: { onNext: (data: Step1CompletedData) => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!email.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const result = await initiateRegistration({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
      redirectTo: '/owner/onboarding?step=2',
    });

    setLoading(false);

    if (!result.success) {
      toast.error(result.error || 'Ocurrió un error. Por favor intenta de nuevo.');
      return;
    }

    // Store in localStorage so the completed view can hydrate from it
    localStorage.setItem('onboarding_first_name', firstName.trim());
    localStorage.setItem('onboarding_last_name', lastName.trim());
    localStorage.setItem('onboarding_email', email.trim());

    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <Mail className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Revisa tu email!
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Enviamos un enlace de confirmación a{' '}
            <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>.
            Haz clic en el enlace para continuar con el registro.
          </p>
        </div>
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200 max-w-sm">
          <p className="font-medium mb-1">¿No recibiste el email?</p>
          <p>Revisa tu carpeta de spam o correo no deseado.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setEmailSent(false)}
          className="text-sm"
        >
          Usar otro email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              placeholder="Juan"
              className="pl-9"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              placeholder="García"
              className="pl-9"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        <p className="text-xs text-muted-foreground">
          Usa al menos 8 caracteres con una mezcla de letras y números.
        </p>
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta y verificar email'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Al registrarte, aceptas nuestros{' '}
        <a href="#" className="underline hover:text-foreground">
          Términos de servicio
        </a>{' '}
        y{' '}
        <a href="#" className="underline hover:text-foreground">
          Política de privacidad
        </a>
        .
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
