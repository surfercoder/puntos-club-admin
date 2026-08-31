"use client";

import { Eye, EyeOff, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect, useReducer } from 'react';
import { toast } from "sonner";

import { appUserFormAction } from '@/actions/dashboard/app_user/app_user-form-actions';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { USER_ROLES } from '@/lib/auth/roles';
import { PUNTOS_CLUB_CAJA_APK_URL } from '@/lib/mobile-apps';
import { createClient } from '@/lib/supabase/client';
import { AppUserSchema } from '@/schemas/app_user.schema';
import { PasswordStrengthChecklist } from '@/components/onboarding/password-strength-checklist';
import { allRulesPass } from '@/components/onboarding/password-rules';
import type { AppUser } from '@/types/app_user';
import type { UserRole } from '@/types/user_role';

export type BranchOption = { id: string; name: string };

interface AppUserFormProps {
  appUser?: AppUser & { branch_id?: number | string | null };
  /** Fija el rol desde la pantalla (Cajeros / Colaboradores) y oculta el selector. */
  lockedRoleName?: 'cashier' | 'collaborator';
  branches?: BranchOption[];
  /** Sucursal preseleccionada al crear (ej: "Asignar cajero" desde Sucursales). */
  defaultBranchId?: string;
  redirectTo?: string;
}

const roleToPlanFeature: Record<string, 'cashiers' | 'collaborators'> = {
  cashier: 'cashiers',
  collaborator: 'collaborators',
};

export default function AppUserForm({
  appUser,
  lockedRoleName,
  branches = [],
  defaultBranchId = '',
  redirectTo = '/dashboard/app_user',
}: AppUserFormProps) {
  const t = useTranslations('Dashboard.appUser');
  const tCommon = useTranslations('Common');
  const { isAtLimit, invalidate } = usePlanUsage();

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [roles, setRoles] = useReducer((_: UserRole[], next: UserRole[]) => next, [] as UserRole[]);
  const [roleId, setRoleId] = useState(appUser?.role_id ? String(appUser.role_id) : '');
  const [branchId, setBranchId] = useState(
    appUser?.branch_id ? String(appUser.branch_id) : defaultBranchId,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  // Utils
  const [actionState, formAction, pending] = useActionState(appUserFormAction, EMPTY_ACTION_STATE);

  // Load roles
  useEffect(() => {
    // Si el formulario se desmonta (o cambia el rol fijado) antes de que
    // responda Supabase, descartamos el resultado en vez de tocar el estado.
    let cancelled = false;
    const supabase = createClient();
    async function loadRoles() {
      const { data } = await supabase
        .from('user_role')
        .select('*')
        .in('name', ['cashier', 'collaborator'])
        .order('name');
      if (cancelled || !data) return;
      setRoles(data as UserRole[]);
      // Cuando la pantalla ya define el rol (Cajeros / Colaboradores) no lo
      // pedimos de nuevo: lo fijamos apenas conocemos su id.
      const locked = lockedRoleName
        ? (data as UserRole[]).find((role) => role.name === lockedRoleName)
        : undefined;
      if (locked) setRoleId(String(locked.id));
    }
    loadRoles();
    return () => { cancelled = true; };
  }, [lockedRoleName]);

  const isCashierSelected = roles.some((r) => String(r.id) === roleId && r.name === USER_ROLES.CASHIER);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
    if (actionState.status === 'success') {
      toast.success(actionState.message);
      invalidate();
    }
  }, [actionState, invalidate]);

  if (actionState.status === 'success') {
    redirect(redirectTo);
  }

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      AppUserSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
      return;
    }

    if (isCashierSelected && !branchId) {
      setValidation({
        status: 'error',
        message: '',
        fieldErrors: { branch_id: [t('form.branchRequired')] },
      });
      event.preventDefault();
      return;
    }

    if (passwordValue && !allRulesPass(passwordValue)) {
      setValidation({
        status: 'error',
        message: '',
        fieldErrors: { password: [tCommon('passwordWeak')] },
      });
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appUser?.id && <input name="id" type="hidden" value={appUser.id} />}

      <div className="flex flex-wrap items-start gap-4">
        {lockedRoleName ? (
          <input name="role_id" type="hidden" value={roleId} />
        ) : (
        <div className="flex-1">
          <Label htmlFor="role_id">{t('form.roleLabel')}</Label>
          <Select value={roleId} onValueChange={setRoleId} name="role_id">
            <SelectTrigger
              id="role_id"
              aria-describedby="role_id-error"
              aria-invalid={!!(validation ?? actionState).fieldErrors?.role_id}
            >
              <SelectValue placeholder={t('form.selectRole')} />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => {
                const feature = roleToPlanFeature[role.name];
                const atLimit = feature ? isAtLimit(feature) : false;
                const optionId = String(role.id);
                const isCurrentRole = String(appUser?.role_id) === optionId;
                return (
                  <SelectItem
                    key={optionId}
                    value={optionId}
                    disabled={atLimit && !isCurrentRole}
                  >
                    {atLimit && !isCurrentRole
                      ? t('form.roleLimitReached', { role: role.display_name })
                      : role.display_name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <FieldError actionState={validation ?? actionState} name="role_id" />
        </div>
        )}

        {isCashierSelected && !lockedRoleName && (
          <a
            href={PUNTOS_CLUB_CAJA_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 flex-col items-center rounded-lg border p-2"
          >
            <div className="rounded-md border-2 border-primary bg-white p-1.5">
              <QRCodeSVG value={PUNTOS_CLUB_CAJA_APK_URL} size={96} bgColor="#ffffff" fgColor="#31A1D6" level="M" />
            </div>
            <span className="mt-1 max-w-28 text-center text-[10px] leading-tight text-muted-foreground">
              {t('form.cashierAppQr')}
            </span>
          </a>
        )}
      </div>

      {isCashierSelected && (
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{t('form.cashierAppInfo')}</span>
        </div>
      )}

      {isCashierSelected && (
        <div>
          <Label htmlFor="branch_id">
            {t('form.branchLabel')} <span className="text-destructive">*</span>
          </Label>
          {branches.length > 0 ? (
            <>
              <Select name="branch_id" onValueChange={setBranchId} value={branchId}>
                <SelectTrigger className="w-full" id="branch_id">
                  <SelectValue placeholder={t('form.selectBranch')} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs text-muted-foreground">{t('form.branchHint')}</p>
              <FieldError actionState={validation ?? actionState} name="branch_id" />
            </>
          ) : (
            // Sin sucursales no hay cajero posible: el orden es sucursal primero.
            <p className="mt-1.5 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {t('form.branchRequiredEmpty')}{' '}
                <Link className="underline" href="/dashboard/branch">
                  {t('form.branchRequiredEmptyLink')}
                </Link>
              </span>
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="first_name">{t('form.firstNameLabel')}</Label>
        <Input
          aria-describedby="first_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
          defaultValue={appUser?.first_name ?? ''}
          id="first_name"
          name="first_name"
          placeholder={t('form.firstNamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="first_name" />
      </div>

      <div>
        <Label htmlFor="last_name">{t('form.lastNameLabel')}</Label>
        <Input
          aria-describedby="last_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
          defaultValue={appUser?.last_name ?? ''}
          id="last_name"
          name="last_name"
          placeholder={t('form.lastNamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="last_name" />
      </div>

      <div>
        <Label htmlFor="email">{t('form.emailLabel')}</Label>
        <Input
          aria-describedby="email-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          defaultValue={appUser?.email ?? ''}
          id="email"
          name="email"
          placeholder={t('form.emailPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="password">{t('form.passwordLabel')}</Label>
        <div className="relative">
          <Input
            aria-describedby="password-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.password}
            className="pr-10"
            id="password"
            name="password"
            placeholder={t('form.passwordPlaceholder')}
            type={showPassword ? 'text' : 'password'}
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <PasswordStrengthChecklist password={passwordValue} />
        <FieldError actionState={validation ?? actionState} name="password" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/app_user">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending || (isCashierSelected && branches.length === 0)} type="submit">
          {appUser ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
