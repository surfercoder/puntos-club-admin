"use client";

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import { AppUserSchema } from '@/schemas/app_user.schema';
import { PasswordStrengthChecklist, allRulesPass } from '@/components/onboarding/password-strength-checklist';
import type { AppUser } from '@/types/app_user';
import type { UserRole } from '@/types/user_role';

interface AppUserFormProps {
  appUser?: AppUser;
  currentUserRole?: string;
}

export default function AppUserForm({ appUser, currentUserRole }: AppUserFormProps) {
  const t = useTranslations('Dashboard.appUser');
  const tCommon = useTranslations('Common');

  const { isAtLimit, invalidate } = usePlanUsage();

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  // Utils
  const [actionState, formAction, pending] = useActionState(appUserFormAction, EMPTY_ACTION_STATE);

  // Map role names to plan feature keys
  const roleToPlanFeature: Record<string, 'cashiers' | 'collaborators'> = {
    cashier: 'cashiers',
    collaborator: 'collaborators',
  };

  // Load roles
  useEffect(() => {
    const supabase = createClient();
    async function loadRoles() {
      // Collaborators can only create/manage cashiers
      const allowedRoles = currentUserRole === 'collaborator'
        ? ['cashier']
        : ['cashier', 'collaborator'];
      const { data } = await supabase
        .from('user_role')
        .select('*')
        .in('name', allowedRoles)
        .order('name');
      if (data) {
        setRoles(data as UserRole[]);
      }
    }
    loadRoles();
  }, [currentUserRole]);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
    if (actionState.status === 'success') {
      toast.success(actionState.message);
      invalidate();
      redirect("/dashboard/app_user");
    }
  }, [actionState, invalidate]);

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

      <div>
        <Label htmlFor="role_id">{t('form.roleLabel')}</Label>
        <Select defaultValue={appUser?.role_id ? String(appUser.role_id) : ''} name="role_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectRole')} />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => {
              const feature = roleToPlanFeature[role.name];
              const atLimit = feature ? isAtLimit(feature) : false;
              const roleId = String(role.id);
              const isCurrentRole = String(appUser?.role_id) === roleId;
              return (
                <SelectItem
                  key={roleId}
                  value={roleId}
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
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrengthChecklist password={passwordValue} />
        <FieldError actionState={validation ?? actionState} name="password" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/app_user">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {appUser ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
