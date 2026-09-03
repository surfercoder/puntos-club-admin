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

type Translate = (key: string, values?: Record<string, string>) => string;

function RoleSelectField({
  roles,
  roleId,
  setRoleId,
  currentRoleId,
  isAtLimit,
  actionState,
  t,
}: {
  roles: UserRole[];
  roleId: string;
  setRoleId: (value: string) => void;
  currentRoleId?: number | string | null;
  isAtLimit: (feature: 'cashiers' | 'collaborators') => boolean;
  actionState: ActionState;
  t: Translate;
}) {
  return (
    <div className="flex-1">
      <Label htmlFor="role_id">{t('form.roleLabel')}</Label>
      <Select value={roleId} onValueChange={setRoleId} name="role_id">
        <SelectTrigger
          id="role_id"
          aria-describedby="role_id-error"
          aria-invalid={!!actionState.fieldErrors?.role_id}
        >
          <SelectValue placeholder={t('form.selectRole')} />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => {
            const feature = roleToPlanFeature[role.name];
            const atLimit = feature ? isAtLimit(feature) : false;
            const optionId = String(role.id);
            const isCurrentRole = String(currentRoleId) === optionId;
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
      <FieldError actionState={actionState} name="role_id" />
    </div>
  );
}

function CashierAppQr({ show }: { show: boolean }) {
  const t = useTranslations('Dashboard.appUser');
  if (!show) return null;
  return (
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
  );
}

function CashierAppInfo({ show }: { show: boolean }) {
  const t = useTranslations('Dashboard.appUser');
  if (!show) return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{t('form.cashierAppInfo')}</span>
    </div>
  );
}

function BranchField({
  show,
  branches,
  branchId,
  setBranchId,
  actionState,
  t,
}: {
  show: boolean;
  branches: BranchOption[];
  branchId: string;
  setBranchId: (value: string) => void;
  actionState: ActionState;
  t: Translate;
}) {
  if (!show) return null;
  return (
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
          <FieldError actionState={actionState} name="branch_id" />
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
  );
}

type RequiredTextFieldName = 'first_name' | 'last_name' | 'email';

function RequiredTextField({
  name,
  label,
  placeholder,
  defaultValue,
  actionState,
}: {
  name: RequiredTextFieldName;
  label: string;
  placeholder: string;
  defaultValue: string;
  actionState: ActionState;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label} <span className="text-destructive">*</span></Label>
      <Input
        aria-describedby={`${name}-error`}
        aria-invalid={!!actionState.fieldErrors?.[name]}
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        type="text"
      />
      <FieldError actionState={actionState} name={name} />
    </div>
  );
}

function PasswordField({
  isEditing,
  actionState,
  t,
}: {
  isEditing: boolean;
  actionState: ActionState;
  t: Translate;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  return (
    <div>
      <Label htmlFor="password">
        {t('form.passwordLabel')}
        {!isEditing && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <Input
          aria-describedby="password-error"
          aria-invalid={!!actionState.fieldErrors?.password}
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
      <FieldError actionState={actionState} name="password" />
    </div>
  );
}

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

  // Utils
  const [actionState, formAction, pending] = useActionState(appUserFormAction, EMPTY_ACTION_STATE);
  const currentActionState = validation ?? actionState;

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
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appUser?.id && <input name="id" type="hidden" value={appUser.id} />}

      <div className="flex flex-wrap items-start gap-4">
        {lockedRoleName ? (
          <input name="role_id" type="hidden" value={roleId} />
        ) : (
          <RoleSelectField
            actionState={currentActionState}
            currentRoleId={appUser?.role_id}
            isAtLimit={isAtLimit}
            roleId={roleId}
            roles={roles}
            setRoleId={setRoleId}
            t={t}
          />
        )}

        <CashierAppQr show={isCashierSelected && !lockedRoleName} />
      </div>

      <CashierAppInfo show={isCashierSelected} />

      <BranchField
        actionState={currentActionState}
        branchId={branchId}
        branches={branches}
        setBranchId={setBranchId}
        show={isCashierSelected}
        t={t}
      />

      <RequiredTextField
        actionState={currentActionState}
        defaultValue={appUser?.first_name ?? ''}
        label={t('form.firstNameLabel')}
        name="first_name"
        placeholder={t('form.firstNamePlaceholder')}
      />

      <RequiredTextField
        actionState={currentActionState}
        defaultValue={appUser?.last_name ?? ''}
        label={t('form.lastNameLabel')}
        name="last_name"
        placeholder={t('form.lastNamePlaceholder')}
      />

      <RequiredTextField
        actionState={currentActionState}
        defaultValue={appUser?.email ?? ''}
        label={t('form.emailLabel')}
        name="email"
        placeholder={t('form.emailPlaceholder')}
      />

      <PasswordField actionState={currentActionState} isEditing={!!appUser} t={t} />

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href={redirectTo}>{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending || (isCashierSelected && branches.length === 0)} type="submit">
          {appUser ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
