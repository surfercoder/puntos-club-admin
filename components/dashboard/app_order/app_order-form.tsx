"use client";

import { useActionState, useState, useEffect } from 'react';
import { appOrderFormAction } from '@/actions/dashboard/app_order/app_order-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { AppOrder } from '@/types/app_order';
import { AppOrderSchema } from '@/schemas/app_order.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {appOrder?.id && <input type="hidden" name="id" value={appOrder.id} />}
      
      <div>
        <Label htmlFor="order_number">Order Number</Label>
        <Input
          id="order_number"
          name="order_number"
          type="text"
          defaultValue={appOrder?.order_number ?? ''}
          placeholder="Enter order number"
        />
        <FieldError actionState={validation ?? actionState} name="order_number" />
      </div>

      <div>
        <Label htmlFor="creation_date">Creation Date</Label>
        <Input
          id="creation_date"
          name="creation_date"
          type="date"
          defaultValue={appOrder?.creation_date ? formatDateForInput(appOrder.creation_date) : ''}
        />
        <FieldError actionState={validation ?? actionState} name="creation_date" />
      </div>

      <div>
        <Label htmlFor="total_points">Total Points</Label>
        <Input
          id="total_points"
          name="total_points"
          type="number"
          min="0"
          defaultValue={appOrder?.total_points ?? 0}
          placeholder="Enter total points"
        />
        <FieldError actionState={validation ?? actionState} name="total_points" />
      </div>

      <div>
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          name="observations"
          defaultValue={appOrder?.observations ?? ''}
          placeholder="Enter observations (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="observations" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/app_order">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {appOrder ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}