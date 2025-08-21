"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>(appUser?.organization_id || '');

  // Utils
  const [actionState, formAction, pending] = useActionState(appUserFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

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
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/app_user");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected organization to form data
    if (selectedOrganization) {
      formData.set('organization_id', selectedOrganization);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      organization_id: formData.get('organization_id') as string,
      first_name: formData.get('first_name') as string || null,
      last_name: formData.get('last_name') as string || null,
      email: formData.get('email') as string || null,
      username: formData.get('username') as string || null,
      password: formData.get('password') as string || null,
      active: formData.get('active') === 'on',
    };

    try {
      AppUserSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appUser?.id && <input name="id" type="hidden" value={appUser.id} />}
      
      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select name="organization_id" onValueChange={setSelectedOrganization} value={selectedOrganization}>
          <SelectTrigger>
            <SelectValue placeholder="Select an organization" />
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
        <Label htmlFor="first_name">First Name</Label>
        <Input
          aria-describedby="first_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
          defaultValue={appUser?.first_name ?? ''}
          id="first_name"
          name="first_name"
          placeholder="Enter first name (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="first_name" />
      </div>

      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          aria-describedby="last_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
          defaultValue={appUser?.last_name ?? ''}
          id="last_name"
          name="last_name"
          placeholder="Enter last name (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="last_name" />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          aria-describedby="email-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          defaultValue={appUser?.email ?? ''}
          id="email"
          name="email"
          placeholder="Enter email (optional)"
          type="email"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          aria-describedby="username-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.username}
          defaultValue={appUser?.username ?? ''}
          id="username"
          name="username"
          placeholder="Enter username (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="username" />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          aria-describedby="password-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.password}
          id="password"
          name="password"
          placeholder="Enter password (optional)"
          type="password"
        />
        <FieldError actionState={validation ?? actionState} name="password" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded border-gray-300"
          defaultChecked={appUser?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/app_user">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {appUser ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}