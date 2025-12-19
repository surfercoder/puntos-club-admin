"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { collaboratorPermissionFormAction } from '@/actions/dashboard/collaborator_permission/collaborator_permission-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { CollaboratorPermissionSchema } from '@/schemas/collaborator_permission.schema';
import type { CollaboratorPermission } from '@/schemas/collaborator_permission.schema';

interface CollaboratorPermissionFormProps {
  collaboratorPermission?: CollaboratorPermission;
}

interface CollaboratorOption {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export default function CollaboratorPermissionForm({ collaboratorPermission }: CollaboratorPermissionFormProps) {
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorOption[]>([]);

  const [actionState, formAction, pending] = useActionState(collaboratorPermissionFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from('app_user')
        .select('id, first_name, last_name, email')
        .eq('active', true)
        .order('first_name');

      if (data) {
        setCollaborators(data);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push('/dashboard/collaborator_permission');
      }, 500);
    }
  }, [actionState, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      CollaboratorPermissionSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {collaboratorPermission?.id && <input name="id" type="hidden" value={collaboratorPermission.id} />}

      <div>
        <Label htmlFor="collaborator_id">Collaborator</Label>
        <Select defaultValue={collaboratorPermission?.collaborator_id ?? ''} name="collaborator_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a collaborator" />
          </SelectTrigger>
          <SelectContent>
            {collaborators.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : c.email || 'Unnamed'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="collaborator_id" />
      </div>

      <div>
        <Label htmlFor="permission_type">Permission Type</Label>
        <Input defaultValue={collaboratorPermission?.permission_type ?? ''} id="permission_type" name="permission_type" type="text" />
        <FieldError actionState={validation ?? actionState} name="permission_type" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded border-gray-300"
          defaultChecked={collaboratorPermission?.can_execute ?? true}
          id="can_execute"
          name="can_execute"
          type="checkbox"
        />
        <Label htmlFor="can_execute">Can execute</Label>
        <FieldError actionState={validation ?? actionState} name="can_execute" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/collaborator_permission">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {collaboratorPermission ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
