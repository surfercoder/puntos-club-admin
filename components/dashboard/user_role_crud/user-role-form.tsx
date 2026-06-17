"use client";

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';

import { userRoleFormAction } from '@/actions/dashboard/user-role/user-role-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { UserRoleSchema } from '@/schemas/user_role.schema';
import type { UserRole } from '@/types/user_role';

interface UserRoleFormProps {
  userRole?: UserRole;
}

export default function UserRoleForm({ userRole }: UserRoleFormProps) {
  const t = useTranslations('UserRole.form');
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [actionState, formAction, pending] = useActionState(userRoleFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      UserRoleSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {userRole?.id && <input name="id" type="hidden" value={userRole.id} />}

      <div>
        <Label htmlFor="name">{t('roleNameLabel')}</Label>
        <Select defaultValue={userRole?.name ?? ''} name="name" disabled={!!userRole}>
          <SelectTrigger><SelectValue placeholder={t('selectRoleType')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="final_user">final_user</SelectItem>
            <SelectItem value="cashier">cashier</SelectItem>
            <SelectItem value="owner">owner</SelectItem>
            <SelectItem value="collaborator">collaborator</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
          </SelectContent>
        </Select>
        {userRole && <input name="name" type="hidden" value={userRole.name} />}
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="display_name">{t('displayNameLabel')}</Label>
        <Input defaultValue={userRole?.display_name ?? ''} id="display_name" name="display_name" placeholder={t('displayNamePlaceholder')} type="text" />
        <FieldError actionState={validation ?? actionState} name="display_name" />
      </div>

      <div>
        <Label htmlFor="description">{t('descriptionLabel')}</Label>
        <Textarea defaultValue={userRole?.description ?? ''} id="description" name="description" placeholder={t('descriptionPlaceholder')} rows={3} />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/user-role">{t('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {userRole ? t('update') : t('create')}
        </Button>
      </div>
    </form>
  );
}
