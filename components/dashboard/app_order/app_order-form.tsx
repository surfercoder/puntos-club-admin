"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { appOrderFormAction } from '@/actions/dashboard/app_order/app_order-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { AppOrderSchema } from '@/schemas/app_order.schema';
import type { AppOrder } from '@/types/app_order';

interface AppOrderFormProps {
  appOrder?: AppOrder;
}

export default function AppOrderForm({ appOrder }: AppOrderFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(appOrderFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/app_order");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Transform form data to match schema expectations
    const transformedData = {
      order_number: formData.get('order_number') as string,
      creation_date: formData.get('creation_date') as string,
      total_points: parseInt(formData.get('total_points') as string) || 0,
      observations: formData.get('observations') as string || null,
    };

    try {
      AppOrderSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {return '';}
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appOrder?.id && <input name="id" type="hidden" value={appOrder.id} />}
      
      <div>
        <Label htmlFor="order_number">Order Number</Label>
        <Input
          aria-describedby="order_number-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.order_number}
          defaultValue={appOrder?.order_number ?? ''}
          id="order_number"
          name="order_number"
          placeholder="Enter order number"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="order_number" />
      </div>

      <div>
        <Label htmlFor="creation_date">Creation Date</Label>
        <Input
          aria-describedby="creation_date-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.creation_date}
          defaultValue={appOrder?.creation_date ? formatDateForInput(appOrder.creation_date) : ''}
          id="creation_date"
          name="creation_date"
          type="date"
        />
        <FieldError actionState={validation ?? actionState} name="creation_date" />
      </div>

      <div>
        <Label htmlFor="total_points">Total Points</Label>
        <Input
          aria-describedby="total_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.total_points}
          defaultValue={appOrder?.total_points ?? 0}
          id="total_points"
          min="0"
          name="total_points"
          placeholder="Enter total points"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="total_points" />
      </div>

      <div>
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          aria-describedby="observations-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.observations}
          defaultValue={appOrder?.observations ?? ''}
          id="observations"
          name="observations"
          placeholder="Enter observations (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="observations" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/app_order">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {appOrder ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}