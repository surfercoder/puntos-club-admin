"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { userFormAction } from '@/actions/dashboard/user/user-form-actions';
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
import { isOwner } from '@/lib/auth/roles';

interface UserFormProps {
  user?: UserWithRelations;
  organizations: Organization[];
  roles: UserRole[];
  currentUser?: AppUserWithRelations;
  defaultOrgId?: string;
}

export default function UserForm({ user, organizations, roles, currentUser, defaultOrgId }: UserFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string>(
    user?.organization_id ?? defaultOrgId ?? ''
  );
  const [selectedRole, setSelectedRole] = useState<string>(user?.role_id ?? '');
  const [isActive, setIsActive] = useState<boolean>(user?.active ?? true);

  // Check if organization field should be disabled (only when there's exactly one org and it's for owners)
  const isOrgDisabled = currentUser && isOwner(currentUser) && organizations.length === 1;

  // Utils
  const [actionState, formAction, pending] = useActionState(userFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      // Check if it's an error message (contains "Failed" or "Error")
      const isError = actionState.message.toLowerCase().includes('failed') || 
                      actionState.message.toLowerCase().includes('error');
      
      if (isError) {
        toast.error(actionState.message);
      } else {
        toast.success(actionState.message);
        setTimeout(() => {
          router.push("/dashboard/users");
        }, 500);
      }
    }
  }, [actionState, router]);

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
        <Label htmlFor="organization_id">Organization *</Label>
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
          <option value="">Select organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
        {isOrgDisabled && (
          <p className="text-sm text-muted-foreground mt-1">
            You can only create users for your organization
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="role_id">Role *</Label>
        <select
          id="role_id"
          name="role_id"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="role_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.role_id}
        >
          <option value="">Select role</option>
          {availableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.display_name} ({role.name})
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="role_id" />
        {selectedRole && (
          <p className="text-sm text-muted-foreground mt-1">
            {roles.find(r => r.id === selectedRole)?.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            aria-describedby="first_name-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
            defaultValue={user?.first_name ?? ''}
            id="first_name"
            name="first_name"
            placeholder="Enter first name"
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="first_name" />
        </div>

        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            aria-describedby="last_name-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
            defaultValue={user?.last_name ?? ''}
            id="last_name"
            name="last_name"
            placeholder="Enter last name"
            type="text"
          />
          <FieldError actionState={validation ?? actionState} name="last_name" />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          aria-describedby="email-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          defaultValue={user?.email ?? ''}
          id="email"
          name="email"
          placeholder="Enter email address"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          aria-describedby="username-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.username}
          defaultValue={user?.username ?? ''}
          id="username"
          name="username"
          placeholder="Enter username (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="username" />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          aria-describedby="phone-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.phone}
          defaultValue={user?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder="Enter phone number (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="document_id">Document ID</Label>
        <Input
          aria-describedby="document_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.document_id}
          defaultValue={user?.document_id ?? ''}
          id="document_id"
          name="document_id"
          placeholder="Enter document ID (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="document_id" />
      </div>

      {getUserType(selectedRole) === 'app_user' && (
        <div>
          <Label htmlFor="password">Password {!user && '*'}</Label>
          <Input
            aria-describedby="password-error"
            aria-invalid={!!(validation ?? actionState).fieldErrors?.password}
            id="password"
            name="password"
            placeholder={user ? "Leave blank to keep current password" : "Enter password"}
            type="password"
          />
          <FieldError actionState={validation ?? actionState} name="password" />
          <p className="text-sm text-muted-foreground mt-1">
            {user ? "Leave blank to keep the current password" : "Minimum 6 characters"}
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
          Active
        </Label>
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/users">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
