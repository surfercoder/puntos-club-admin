"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { historyFormAction } from '@/actions/dashboard/history/history-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { HistorySchema } from '@/schemas/history.schema';
import type { History } from '@/types/history';

interface HistoryFormProps {
  history?: History;
}

interface AppOrder {
  id: string;
  order_number: string;
}

interface Status {
  id: string;
  name: string;
}

export default function HistoryForm({ history }: HistoryFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);

  // Utils
  const [actionState, formAction, pending] = useActionState(historyFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load orders and statuses
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      const [ordersResult, statusesResult] = await Promise.all([
        supabase.from('app_order').select('id, order_number').order('order_number'),
        supabase.from('status').select('id, name').order('name')
      ]);

      if (ordersResult.data) {
        setOrders(ordersResult.data);
      }
      if (statusesResult.data) {
        setStatuses(statusesResult.data);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/history");
      }, 500);
    }
  }, [actionState, router]);

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {return '';}
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      HistorySchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {history?.id && <input name="id" type="hidden" value={history.id} />}
      
      <div>
        <Label htmlFor="order_id">Order</Label>
        <Select defaultValue={history?.order_id ?? ''} name="order_id">
          <SelectTrigger>
            <SelectValue placeholder="Select an order" />
          </SelectTrigger>
          <SelectContent>
            {orders.map((order) => (
              <SelectItem key={order.id} value={order.id}>
                {order.order_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="order_id" />
      </div>

      <div>
        <Label htmlFor="status_id">Status (Optional)</Label>
        <Select defaultValue={history?.status_id ?? ''} name="status_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a status (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="status_id" />
      </div>

      <div>
        <Label htmlFor="change_date">Change Date</Label>
        <Input
          aria-describedby="change_date-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.change_date}
          defaultValue={history?.change_date ? formatDateForInput(history.change_date) : ''}
          id="change_date"
          name="change_date"
          type="date"
        />
        <FieldError actionState={validation ?? actionState} name="change_date" />
      </div>

      <div>
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          aria-describedby="observations-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.observations}
          defaultValue={history?.observations ?? ''}
          id="observations"
          name="observations"
          placeholder="Enter observations (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="observations" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/history">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {history ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}