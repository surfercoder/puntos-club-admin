"use client";

import Link from 'next/link';
import { useActionState, useState, useEffect, useReducer } from 'react';
import { useTranslations } from 'next-intl';

import { pushTokenFormAction } from '@/actions/dashboard/push_tokens/push-token-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { PushTokenSchema } from '@/schemas/push_token.schema';
import type { PushToken } from '@/types/push_token';

interface PushTokenFormProps {
  pushToken?: PushToken;
}

export default function PushTokenForm({ pushToken }: PushTokenFormProps) {
  const t = useTranslations('Dashboard.pushTokensCrud.form');
  const [validation, setValidation] = useState<ActionState | null>(null);
  type BeneficiaryRow = { id: string; first_name: string; last_name: string; email: string };
  const [beneficiaries, setBeneficiaries] = useReducer((_: BeneficiaryRow[], next: BeneficiaryRow[]) => next, [] as BeneficiaryRow[]);

  useEffect(() => {
    async function loadBeneficiaries() {
      const supabase = createClient();
      const { data } = await supabase.from('beneficiary').select('id, first_name, last_name, email').order('first_name');
      if (data) setBeneficiaries(data);
    }
    loadBeneficiaries();
  }, []);

  const [actionState, formAction, pending] = useActionState(pushTokenFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      PushTokenSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {pushToken?.id && <input name="id" type="hidden" value={pushToken.id} />}

      <div>
        <Label htmlFor="beneficiary_id">{t('beneficiaryLabel')}</Label>
        <Select defaultValue={pushToken?.beneficiary_id ?? ''} name="beneficiary_id">
          <SelectTrigger><SelectValue placeholder={t('selectBeneficiary')} /></SelectTrigger>
          <SelectContent>
            {beneficiaries.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.first_name} {b.last_name} ({b.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="expo_push_token">{t('expoPushTokenLabel')}</Label>
        <Input defaultValue={pushToken?.expo_push_token ?? ''} id="expo_push_token" name="expo_push_token" placeholder="ExponentPushToken[...]" type="text" />
        <FieldError actionState={validation ?? actionState} name="expo_push_token" />
      </div>

      <div>
        <Label htmlFor="device_id">{t('deviceIdLabel')}</Label>
        <Input defaultValue={pushToken?.device_id ?? ''} id="device_id" name="device_id" placeholder={t('deviceIdPlaceholder')} type="text" />
        <FieldError actionState={validation ?? actionState} name="device_id" />
      </div>

      <div>
        <Label htmlFor="platform">{t('platformLabel')}</Label>
        <Select defaultValue={pushToken?.platform ?? ''} name="platform">
          <SelectTrigger><SelectValue placeholder={t('selectPlatform')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ios">{t('ios')}</SelectItem>
            <SelectItem value="android">{t('android')}</SelectItem>
            <SelectItem value="web">{t('web')}</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="platform" />
      </div>

      <div className="flex items-center gap-2">
        <input aria-label={t('active')} className="rounded" defaultChecked={pushToken?.is_active ?? true} id="is_active" name="is_active" type="checkbox" />
        <Label htmlFor="is_active">{t('active')}</Label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/push_tokens">{t('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {pushToken ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}
