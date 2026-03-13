"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { appUserFormAction } from '@/actions/dashboard/app_user/app_user-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { AppUserSchema } from '@/schemas/app_user.schema';
import type { AppUser } from '@/types/app_user';

interface AppUserFormProps {
  appUser?: AppUser;
}

interface Organization {
  id: string;
  name: string;
}

export default function AppUserForm({ appUser }: AppUserFormProps) {
  const t = useTranslations('Dashboard.appUser');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Utils
  const [actionState, formAction, pending] = useActionState(appUserFormAction, EMPTY_ACTION_STATE);

  // Load organizations
  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createClient();
      const { data } = await supabase
        .from('organization')
        .select('id, name')
        .order('name');
      if (data) {
        setOrganizations(data);
      }
    }
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    redirect("/dashboard/app_user");
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
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appUser?.id && <input name="id" type="hidden" value={appUser.id} />}
      
      <div>
        <Label htmlFor="organization_id">{t('form.organizationLabel')}</Label>
        <Select defaultValue={appUser?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectOrganization')} />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
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
        <Label htmlFor="username">{t('form.usernameLabel')}</Label>
        <Input
          aria-describedby="username-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.username}
          defaultValue={appUser?.username ?? ''}
          id="username"
          name="username"
          placeholder={t('form.usernamePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="username" />
      </div>

      <div>
        <Label htmlFor="password">{t('form.passwordLabel')}</Label>
        <Input
          aria-describedby="password-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.password}
          id="password"
          name="password"
          placeholder={t('form.passwordPlaceholder')}
          type="password"
        />
        <FieldError actionState={validation ?? actionState} name="password" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded"
          defaultChecked={appUser?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">{t('form.activeLabel')}</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
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