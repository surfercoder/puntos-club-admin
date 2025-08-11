"use client";

import { useActionState, useState, useEffect } from 'react';
import { historyFormAction } from '@/actions/dashboard/history/history-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { History } from '@/types/history';
import { HistorySchema } from '@/schemas/history.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  const [selectedOrder, setSelectedOrder] = useState<string>(history?.order_id || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(history?.status_id || '');

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
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected values to form data
    if (selectedOrder) {
      formData.set('order_id', selectedOrder);
    }
    if (selectedStatus) {
      formData.set('status_id', selectedStatus);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      order_id: formData.get('order_id') as string,
      status_id: formData.get('status_id') as string || null,
      change_date: formData.get('change_date') as string,
      observations: formData.get('observations') as string || null,
    };

    try {
      HistorySchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {history?.id && <input type="hidden" name="id" value={history.id} />}
      
      <div>
        <Label htmlFor="order_id">Order</Label>
        <Select value={selectedOrder} onValueChange={setSelectedOrder} name="order_id">
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
        <Select value={selectedStatus} onValueChange={setSelectedStatus} name="status_id">
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
          id="change_date"
          name="change_date"
          type="date"
          defaultValue={history?.change_date ? formatDateForInput(history.change_date) : ''}
        />
        <FieldError actionState={validation ?? actionState} name="change_date" />
      </div>

      <div>
        <Label htmlFor="observations">Observations</Label>
        <Textarea
          id="observations"
          name="observations"
          defaultValue={history?.observations ?? ''}
          placeholder="Enter observations (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="observations" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/history">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {history ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}