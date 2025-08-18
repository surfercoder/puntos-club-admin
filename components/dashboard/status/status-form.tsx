"use client";

import { useActionState, useState, useEffect } from 'react';
import { statusFormAction } from '@/actions/dashboard/status/status-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Status } from '@/types/status';
import { StatusSchema } from '@/schemas/status.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Transform form data to match schema expectations
    const transformedData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      is_terminal: formData.get('is_terminal') === 'on',
      order_num: parseInt(formData.get('order_num') as string) || 0,
    };

    try {
      StatusSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {status?.id && <input type="hidden" name="id" value={status.id} />}
      
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={status?.name ?? ''}
          placeholder="Enter status name"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          aria-describedby="name-error"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={status?.description ?? ''}
          placeholder="Enter status description (optional)"
          rows={3}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.description}
          aria-describedby="description-error"
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div>
        <Label htmlFor="order_num">Order Number</Label>
        <Input
          id="order_num"
          name="order_num"
          type="number"
          defaultValue={status?.order_num ?? 0}
          placeholder="Enter order number"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.order_num}
          aria-describedby="order_num-error"
        />
        <FieldError actionState={validation ?? actionState} name="order_num" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_terminal"
          name="is_terminal"
          defaultChecked={status?.is_terminal ?? false}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_terminal">Is Terminal Status</Label>
        <FieldError actionState={validation ?? actionState} name="is_terminal" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/status">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {status ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
