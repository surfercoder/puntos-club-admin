"use client";

import { useActionState, useState, useEffect } from 'react';
import { userPermissionFormAction } from '@/actions/dashboard/user_permission/user_permission-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { UserPermission } from '@/types/user_permission';
import { UserPermissionSchema } from '@/schemas/user_permission.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  const [selectedUser, setSelectedUser] = useState<string>(userPermission?.user_id || '');
  const [selectedBranch, setSelectedBranch] = useState<string>(userPermission?.branch_id || '');

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
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected values to form data
    if (selectedUser) {
      formData.set('user_id', selectedUser);
    }
    if (selectedBranch) {
      formData.set('branch_id', selectedBranch);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      user_id: formData.get('user_id') as string,
      branch_id: formData.get('branch_id') as string,
      action: formData.get('action') as string,
      assignment_date: formData.get('assignment_date') as string,
    };

    try {
      UserPermissionSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {userPermission?.id && <input type="hidden" name="id" value={userPermission.id} />}
      
      <div>
        <Label htmlFor="user_id">User</Label>
        <Select value={selectedUser} onValueChange={setSelectedUser} name="user_id">
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
        <Select value={selectedBranch} onValueChange={setSelectedBranch} name="branch_id">
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
          id="action"
          name="action"
          type="text"
          defaultValue={userPermission?.action ?? ''}
          placeholder="Enter permitted action (e.g., 'read', 'write', 'admin')"
        />
        <FieldError actionState={validation ?? actionState} name="action" />
      </div>

      <div>
        <Label htmlFor="assignment_date">Assignment Date</Label>
        <Input
          id="assignment_date"
          name="assignment_date"
          type="date"
          defaultValue={userPermission?.assignment_date ? formatDateForInput(userPermission.assignment_date) : ''}
        />
        <FieldError actionState={validation ?? actionState} name="assignment_date" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/user_permission">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {userPermission ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}