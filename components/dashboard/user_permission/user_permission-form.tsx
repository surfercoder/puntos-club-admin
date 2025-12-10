"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { userPermissionFormAction } from '@/actions/dashboard/user_permission/user_permission-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { UserPermissionSchema } from '@/schemas/user_permission.schema';
import type { UserPermission } from '@/types/user_permission';

interface UserPermissionFormProps {
  userPermission?: UserPermission;
}

interface AppUser {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface Branch {
  id: string;
  name: string;
}

export default function UserPermissionForm({ userPermission }: UserPermissionFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Utils
  const [actionState, formAction, pending] = useActionState(userPermissionFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load users and branches
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      const [usersResult, branchesResult] = await Promise.all([
        supabase.from('app_user').select('id, first_name, last_name, email').eq('active', true).order('first_name'),
        supabase.from('branch').select('id, name').eq('active', true).order('name')
      ]);

      if (usersResult.data) {
        setUsers(usersResult.data);
      }
      if (branchesResult.data) {
        setBranches(branchesResult.data);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/user_permission");
      }, 500);
    }
  }, [actionState, router]);

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {return '';}
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      UserPermissionSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {userPermission?.id && <input name="id" type="hidden" value={userPermission.id} />}
      
      <div>
        <Label htmlFor="user_id">User</Label>
        <Select defaultValue={userPermission?.user_id ?? ''} name="user_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name || user.last_name 
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user.email || 'Unnamed User'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="user_id" />
      </div>

      <div>
        <Label htmlFor="branch_id">Branch</Label>
        <Select defaultValue={userPermission?.branch_id ?? ''} name="branch_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div>
        <Label htmlFor="action">Action</Label>
        <Input
          defaultValue={userPermission?.action ?? ''}
          id="action"
          name="action"
          placeholder="Enter permitted action (e.g., 'read', 'write', 'admin')"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="action" />
      </div>

      <div>
        <Label htmlFor="assignment_date">Assignment Date</Label>
        <Input
          defaultValue={userPermission?.assignment_date ? formatDateForInput(userPermission.assignment_date) : ''}
          id="assignment_date"
          name="assignment_date"
          type="date"
        />
        <FieldError actionState={validation ?? actionState} name="assignment_date" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/user_permission">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {userPermission ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}