"use client";

import { useActionState, useState, useEffect } from 'react';
import { appUserFormAction } from '@/actions/dashboard/app_user/app_user-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { AppUser } from '@/types/app_user';
import { AppUserSchema } from '@/schemas/app_user.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
      {appUser?.id && <input type="hidden" name="id" value={appUser.id} />}
      
      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select value={selectedOrganization} onValueChange={setSelectedOrganization} name="organization_id">
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
          id="first_name"
          name="first_name"
          type="text"
          defaultValue={appUser?.first_name ?? ''}
          placeholder="Enter first name (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="first_name" />
      </div>

      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          name="last_name"
          type="text"
          defaultValue={appUser?.last_name ?? ''}
          placeholder="Enter last name (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="last_name" />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={appUser?.email ?? ''}
          placeholder="Enter email (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          defaultValue={appUser?.username ?? ''}
          placeholder="Enter username (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="username" />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter password (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="password" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={appUser?.active ?? true}
          className="rounded border-gray-300"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/app_user">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {appUser ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}