'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { sendPlatformBroadcastAction } from '@/actions/dashboard/platform/actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EMPTY_ACTION_STATE } from '@/lib/action-state';
import { BROADCAST_BODY_MAX_LENGTH, BROADCAST_TITLE_MAX_LENGTH } from '@/schemas/platform.schema';

/** Comunicado del superadmin a todos los beneficiarios con la app instalada. */
export function BroadcastForm({ deviceCount }: { deviceCount: number }) {
  const t = useTranslations('Dashboard.platformBroadcasts');
  const [state, formAction, pending] = useActionState(sendPlatformBroadcastAction, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.status === 'error' && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">{t('titleLabel')}</Label>
        <Input id="title" maxLength={BROADCAST_TITLE_MAX_LENGTH} name="title" placeholder={t('titlePlaceholder')} required />
        <FieldError actionState={state} name="title" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">{t('bodyLabel')}</Label>
        <Textarea id="body" maxLength={BROADCAST_BODY_MAX_LENGTH} name="body" placeholder={t('bodyPlaceholder')} required rows={4} />
        <FieldError actionState={state} name="body" />
      </div>
      {/* Un push a toda la plataforma no se puede deshacer: se confirma a mano. */}
      <label className="flex items-start gap-2 text-sm">
        <input className="mt-0.5" name="confirm" required type="checkbox" />
        <span>{t('confirm', { count: deviceCount })}</span>
      </label>
      <div className="flex justify-end">
        <Button disabled={pending} type="submit">{pending ? t('sending') : t('send')}</Button>
      </div>
    </form>
  );
}
