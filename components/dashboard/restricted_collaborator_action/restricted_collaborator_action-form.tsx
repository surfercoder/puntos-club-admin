"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { restrictedCollaboratorActionFormAction } from '@/actions/dashboard/restricted_collaborator_action/restricted_collaborator_action-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { RestrictedCollaboratorActionSchema } from '@/schemas/restricted_collaborator_action.schema';
import type { RestrictedCollaboratorAction } from '@/schemas/restricted_collaborator_action.schema';

interface RestrictedCollaboratorActionFormProps {
  restrictedAction?: RestrictedCollaboratorAction;
}

export default function RestrictedCollaboratorActionForm({ restrictedAction }: RestrictedCollaboratorActionFormProps) {
  const [validation, setValidation] = useState<ActionState | null>(null);

  const [actionState, formAction, pending] = useActionState(restrictedCollaboratorActionFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push('/dashboard/restricted_collaborator_action');
      }, 500);
    }
  }, [actionState, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      RestrictedCollaboratorActionSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {restrictedAction?.id && <input name="id" type="hidden" value={restrictedAction.id} />}

      <div>
        <Label htmlFor="action_name">Action Name</Label>
        <Input defaultValue={restrictedAction?.action_name ?? ''} id="action_name" name="action_name" type="text" />
        <FieldError actionState={validation ?? actionState} name="action_name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea defaultValue={restrictedAction?.description ?? ''} id="description" name="description" rows={3} />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/restricted_collaborator_action">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {restrictedAction ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
