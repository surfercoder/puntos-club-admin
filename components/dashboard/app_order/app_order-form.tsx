"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
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
  const t = useTranslations('Dashboard.appOrder');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(appOrderFormAction, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    redirect("/dashboard/app_order");
  }

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      AppOrderSchema.parse(formData);
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
        <Label htmlFor="order_number">{t('form.orderNumber')}</Label>
        <Input
          aria-describedby="order_number-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.order_number}
          defaultValue={appOrder?.order_number ?? ''}
          id="order_number"
          name="order_number"
          placeholder={t('form.orderNumberPlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="order_number" />
      </div>

      <div>
        <Label htmlFor="creation_date">{t('form.creationDate')}</Label>
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
        <Label htmlFor="total_points">{t('form.totalPoints')}</Label>
        <Input
          aria-describedby="total_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.total_points}
          defaultValue={appOrder?.total_points ?? 0}
          id="total_points"
          name="total_points"
          placeholder={t('form.totalPointsPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="total_points" />
      </div>

      <div>
        <Label htmlFor="observations">{t('form.observations')}</Label>
        <Textarea
          aria-describedby="observations-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.observations}
          defaultValue={appOrder?.observations ?? ''}
          id="observations"
          name="observations"
          placeholder={t('form.observationsPlaceholder')}
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="observations" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/app_order">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {appOrder ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}