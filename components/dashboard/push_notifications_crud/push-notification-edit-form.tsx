"use client";

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { pushNotificationFormAction } from '@/actions/dashboard/push_notifications/push-notification-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { PushNotificationSchema } from '@/schemas/push_notification.schema';
import type { PushNotification } from '@/types/push_notification';

interface PushNotificationEditFormProps {
  notification: PushNotification;
}

export default function PushNotificationEditForm({ notification }: PushNotificationEditFormProps) {
  const t = useTranslations('Dashboard.notifications.editForm');
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [actionState, formAction, pending] = useActionState(pushNotificationFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      PushNotificationSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      <input name="id" type="hidden" value={notification.id} />
      <input name="organization_id" type="hidden" value={notification.organization_id} />
      <input name="created_by" type="hidden" value={notification.created_by} />

      <div>
        <Label htmlFor="title">{t('titleLabel')}</Label>
        <Input defaultValue={notification.title} id="title" name="title" placeholder={t('titlePlaceholder')} type="text" />
        <FieldError actionState={validation ?? actionState} name="title" />
      </div>

      <div>
        <Label htmlFor="body">{t('bodyLabel')}</Label>
        <Textarea defaultValue={notification.body} id="body" name="body" placeholder={t('bodyPlaceholder')} rows={4} />
        <FieldError actionState={validation ?? actionState} name="body" />
      </div>

      <div>
        <Label htmlFor="status">{t('statusLabel')}</Label>
        <Select defaultValue={notification.status} name="status">
          <SelectTrigger><SelectValue placeholder={t('selectStatus')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">{t('statusDraft')}</SelectItem>
            <SelectItem value="sending">{t('statusSending')}</SelectItem>
            <SelectItem value="sent">{t('statusSent')}</SelectItem>
            <SelectItem value="failed">{t('statusFailed')}</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="status" />
      </div>

      <div>
        <Label htmlFor="sent_count">{t('sentCountLabel')}</Label>
        <Input defaultValue={notification.sent_count} id="sent_count" name="sent_count" type="number" min="0" />
        <FieldError actionState={validation ?? actionState} name="sent_count" />
      </div>

      <div>
        <Label htmlFor="failed_count">{t('failedCountLabel')}</Label>
        <Input defaultValue={notification.failed_count} id="failed_count" name="failed_count" type="number" min="0" />
        <FieldError actionState={validation ?? actionState} name="failed_count" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/push_notifications">{t('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {t('update')}
        </Button>
      </div>
    </form>
  );
}
