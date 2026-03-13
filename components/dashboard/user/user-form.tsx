"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from "sonner";

import { userFormAction } from '@/actions/dashboard/user/user-form-actions';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { UserSchema } from '@/schemas/user.schema';
import type { Organization } from '@/types/organization';
import type { UserWithRelations } from '@/types/user';
import type { UserRole } from '@/types/user_role';
import type { AppUserWithRelations } from '@/types/app_user';
import type { PlanFeatureKey } from '@/types/plan';
import { isOwner } from '@/lib/auth/roles';

const EMPTY_DISABLED_ROLES: string[] = [];

interface UserFormProps {
  user?: UserWithRelations;
  organizations: Organization[];
  roles: UserRole[];
  currentUser?: AppUserWithRelations;
  defaultOrgId?: string;
  disabledRoleNames?: string[];
}

const ROLE_FEATURE_MAP: Record<string, PlanFeatureKey> = {
  cashier: 'cashiers',
  collaborator: 'collaborators',
};

export default function UserForm({ user, organizations, roles, currentUser, defaultOrgId, disabledRoleNames: disabledRoleNamesProp = EMPTY_DISABLED_ROLES }: UserFormProps) {
  const t = useTranslations('Dashboard.user.form');
  const tCommon = useTranslations('Common');
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>(
    user?.organization_id ?? defaultOrgId ?? ''
  );
  const [selectedRole, setSelectedRole] = useState<string>(user?.role_id ?? '');
  const [isActive, setIsActive] = useState<boolean>(user?.active ?? true);

  // Check if organization field should be disabled (only when there's exactly one org and it's for owners)
  const isOrgDisabled = currentUser && isOwner(currentUser) && organizations.length === 1;

  // Utils
  const router = useRouter();
  const { invalidate, isAtLimit } = usePlanUsage();

  // Derive disabled roles from plan usage context (overrides server prop)
  // When editing, the user's current role should never be disabled (they already occupy that slot)
  const currentRoleName = user ? roles.find(r => r.id === user.role_id)?.name : undefined;
  const disabledRoleNames = Object.entries(ROLE_FEATURE_MAP)
    .filter(([roleName, feature]) => isAtLimit(feature) && roleName !== currentRoleName)
    .map(([role]) => role)
    .concat(disabledRoleNamesProp)
    .filter((v, i, a) => a.indexOf(v) === i);

  const wrappedAction = async (state: ActionState, formData: FormData) => {
    const result = await userFormAction(state, formData);
    if (result.message) {
      const isError = result.message.toLowerCase().includes('failed') ||
                      result.message.toLowerCase().includes('error');
      if (isError) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        invalidate();
        setTimeout(() => router.push("/dashboard/users"), 500);
      }
    }
    return result;
  };

  const [actionState, formAction, pending] = useActionState(wrappedAction, EMPTY_ACTION_STATE);

  // Determine user_type based on selected role
  const getUserType = (roleId: string | undefined): 'app_user' | 'beneficiary' => {
    if (!roleId) return 'app_user';
    const role = roles.find(r => r.id === roleId);
    return role?.name === 'final_user' ? 'beneficiary' : 'app_user';
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      UserSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  // Filter roles based on permissions (admins can assign any role)
  const availableRoles = roles;

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {user?.id && <input name="id" type="hidden" value={user.id} />}
      <input name="user_type" type="hidden" value={getUserType(selectedRole)} />
      <input name="active" type="hidden" value={isActive.toString()} />
      {isOrgDisabled && <input name="organization_id" type="hidden" value={selectedOrg} />}
      
      <div>
        <Label htmlFor="organization_id">{t('organizationLabel')}</Label>
        <select
          id="organization_id"
          name={isOrgDisabled ? undefined : "organization_id"}
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          disabled={isOrgDisabled}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="organization_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.organization_id}
        >
          <option value="">{t('selectOrganization')}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
        {isOrgDisabled && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('orgDisabledHint')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="role_id">{t('roleLabel')}</Label>
        <select
          id="role_id"
          name="role_id"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="role_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.role_id}
        >
          <option value="">{t('selectRole')}</option>
          {availableRoles.map((role) => {
            const isRoleDisabled = disabledRoleNames.includes(role.name);
            return (
              <option key={role.id} value={role.id} disabled={isRoleDisabled}>
                {role.display_name} ({role.name}){isRoleDisabled ? ` — ${t('roleLimitReached')}` : ''}
              </option>
            );
          })}
        </select>
        <FieldError actionState={validation ?? actionState} name="role_id" />
        {selectedRole && disabledRoleNames.includes(roles.find(r => r.id === selectedRole)?.name ?? '') && (
          <p className="text-sm text-destructive mt-1">
            {t('roleLimitReachedHint')}
          </p>
        )}
        {selectedRole && !disabledRoleNames.includes(roles.find(r => r.id === selectedRole)?.name ?? '') && (
          <p className="text-sm text-muted-foreground mt-1">
            {roles.find(r => r.id === selectedRole)?.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">{t('firstNameLabel')}</Label>
          <Input
            aria-describedby="first_name-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
            defaultValue={user?.first_name ?? ''}
            id="first_name"
            name="first_name"
            placeholder={t('firstNamePlaceholder')}
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="first_name" />
        </div>

        <div>
          <Label htmlFor="last_name">{t('lastNameLabel')}</Label>
          <Input
            aria-describedby="last_name-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
            defaultValue={user?.last_name ?? ''}
            id="last_name"
            name="last_name"
            placeholder={t('lastNamePlaceholder')}
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="last_name" />
        </div>
      </div>

      <div>
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          aria-describedby="email-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          defaultValue={user?.email ?? ''}
          id="email"
          name="email"
          placeholder={t('emailPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="username">{t('usernameLabel')}</Label>
        <Input
          aria-describedby="username-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.username}
          defaultValue={user?.username ?? ''}
          id="username"
          name="username"
          placeholder={t('usernamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="username" />
      </div>

      <div>
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input
          aria-describedby="phone-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.phone}
          defaultValue={user?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder={t('phonePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="document_id">{t('documentIdLabel')}</Label>
        <Input
          aria-describedby="document_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.document_id}
          defaultValue={user?.document_id ?? ''}
          id="document_id"
          name="document_id"
          placeholder={t('documentIdPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="document_id" />
      </div>

      {getUserType(selectedRole) === 'app_user' && (
        <div>
          <Label htmlFor="password">{user ? t('passwordLabel') : t('passwordRequired')}</Label>
          <Input
            aria-describedby="password-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.password}
            id="password"
            name="password"
            placeholder={user ? t('passwordKeepBlank') : t('passwordPlaceholder')}
            type="password"
          />
          <FieldError actionState={validation ?? actionState} name="password" />
          <p className="text-sm text-muted-foreground mt-1">
            {user ? t('passwordKeepBlank') : t('passwordMinLength')}
          </p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isActive}
          id="active"
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <Label
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          htmlFor="active"
        >
          {t('active')}
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/users">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending || disabledRoleNames.includes(roles.find(r => r.id === selectedRole)?.name ?? '')} type="submit">
          {user ? t('updateUser') : t('createUser')}
        </Button>
      </div>
    </form>
  );
}
