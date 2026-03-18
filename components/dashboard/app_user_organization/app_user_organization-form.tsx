"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { appUserOrganizationFormAction } from '@/actions/dashboard/app_user_organization/app_user_organization-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { AppUserOrganizationSchema } from '@/schemas/app_user_organization.schema';
import type { AppUserOrganization } from '@/schemas/app_user_organization.schema';

interface AppUserOrganizationFormProps {
  appUserOrganization?: AppUserOrganization;
}

interface AppUserOption {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface OrganizationOption {
  id: string;
  name: string;
}

export default function AppUserOrganizationForm({ appUserOrganization }: AppUserOrganizationFormProps) {
  const t = useTranslations('Dashboard.appUserOrganization');
  const tCommon = useTranslations('Common');

  const [validation, setValidation] = useState<ActionState | null>(null);
  const [users, setUsers] = useState<AppUserOption[]>([]);
  const [orgs, setOrgs] = useState<OrganizationOption[]>([]);

  const [actionState, formAction, pending] = useActionState(appUserOrganizationFormAction, EMPTY_ACTION_STATE);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [usersResult, orgsResult] = await Promise.all([
        supabase.from('app_user').select('id, first_name, last_name, email').order('first_name'),
        supabase.from('organization').select('id, name').order('name'),
      ]);

      if (usersResult.data) setUsers(usersResult.data);
      if (orgsResult.data) setOrgs(orgsResult.data);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    redirect('/dashboard/app_user_organization');
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      AppUserOrganizationSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appUserOrganization?.id && <input name="id" type="hidden" value={appUserOrganization.id} />}

      <div>
        <Label htmlFor="app_user_id">{t('form.userLabel')}</Label>
        <Select defaultValue={appUserOrganization?.app_user_id ?? ''} name="app_user_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectUser')} />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {/* c8 ignore next */ u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email || t('form.noName')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="app_user_id" />
      </div>

      <div>
        <Label htmlFor="organization_id">{t('form.organizationLabel')}</Label>
        <Select defaultValue={appUserOrganization?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectOrganization')} />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded"
          defaultChecked={appUserOrganization?.is_active ?? true}
          id="is_active"
          name="is_active"
          type="checkbox"
        />
        <Label htmlFor="is_active">{t('form.activeLabel')}</Label>
        <FieldError actionState={validation ?? actionState} name="is_active" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/app_user_organization">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {appUserOrganization ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
