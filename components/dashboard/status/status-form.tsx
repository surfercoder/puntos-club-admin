"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { statusFormAction } from '@/actions/dashboard/status/status-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { StatusSchema } from '@/schemas/status.schema';
import type { Status } from '@/types/status';

interface StatusFormProps {
  status?: Status;
}

export default function StatusForm({ status }: StatusFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(statusFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/status");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      StatusSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {status?.id && <input name="id" type="hidden" value={status.id} />}
      
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          aria-describedby="name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          defaultValue={status?.name ?? ''}
          id="name"
          name="name"
          placeholder="Enter status name"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          aria-describedby="description-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.description}
          defaultValue={status?.description ?? ''}
          id="description"
          name="description"
          placeholder="Enter status description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div>
        <Label htmlFor="order_num">Order Number</Label>
        <Input
          aria-describedby="order_num-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.order_num}
          defaultValue={status?.order_num ?? 0}
          id="order_num"
          name="order_num"
          placeholder="Enter order number"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="order_num" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded border-gray-300"
          defaultChecked={status?.is_terminal ?? false}
          id="is_terminal"
          name="is_terminal"
          type="checkbox"
        />
        <Label htmlFor="is_terminal">Is Terminal Status</Label>
        <FieldError actionState={validation ?? actionState} name="is_terminal" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/status">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {status ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
