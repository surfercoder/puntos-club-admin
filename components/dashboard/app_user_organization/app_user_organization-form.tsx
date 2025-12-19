"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [users, setUsers] = useState<AppUserOption[]>([]);
  const [orgs, setOrgs] = useState<OrganizationOption[]>([]);

  const [actionState, formAction, pending] = useActionState(appUserOrganizationFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

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
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push('/dashboard/app_user_organization');
      }, 500);
    }
  }, [actionState, router]);

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
        <Label htmlFor="app_user_id">User</Label>
        <Select defaultValue={appUserOrganization?.app_user_id ?? ''} name="app_user_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email || 'Unnamed'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="app_user_id" />
      </div>

      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select defaultValue={appUserOrganization?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder="Select an organization" />
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
          className="rounded border-gray-300"
          defaultChecked={appUserOrganization?.is_active ?? true}
          id="is_active"
          name="is_active"
          type="checkbox"
        />
        <Label htmlFor="is_active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="is_active" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/app_user_organization">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {appUserOrganization ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
