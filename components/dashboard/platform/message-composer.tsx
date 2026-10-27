'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { sendPlatformMessageAction } from '@/actions/dashboard/platform/actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EMPTY_ACTION_STATE } from '@/lib/action-state';
import { ALL_ORGS, MESSAGE_MAX_LENGTH } from '@/schemas/platform.schema';

/**
 * Caja para escribir en el hilo. Con `organizationId` responde en ese hilo; con
 * `organizations` (solo superadmin) deja elegir a quien, o a todas.
 */
export function MessageComposer({
  organizationId,
  organizations,
}: {
  organizationId?: number;
  organizations?: { id: number; name: string }[];
}) {
  const t = useTranslations('Dashboard.platformMessages');
  const [state, formAction, pending] = useActionState(sendPlatformMessageAction, EMPTY_ACTION_STATE);
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
    <form ref={formRef} action={formAction} className="space-y-3">
      {organizationId ? <input name="organization_id" type="hidden" value={organizationId} /> : null}
      {organizations ? (
        <div className="space-y-1">
          <Label htmlFor="organization_id">{t('toLabel')}</Label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            defaultValue=""
            id="organization_id"
            name="organization_id"
            required
          >
            <option disabled value="">{t('toPlaceholder')}</option>
            <option value={ALL_ORGS}>{t('toAll')}</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="space-y-1">
        <Label className="sr-only" htmlFor="body">{t('bodyLabel')}</Label>
        <Textarea id="body" maxLength={MESSAGE_MAX_LENGTH} name="body" placeholder={t('bodyPlaceholder')} required rows={3} />
        <FieldError actionState={state} name="body" />
      </div>
      <div className="flex justify-end">
        <Button disabled={pending} type="submit">{pending ? t('sending') : t('send')}</Button>
      </div>
    </form>
  );
}
