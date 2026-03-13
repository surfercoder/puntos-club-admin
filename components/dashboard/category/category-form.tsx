"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useActionState, useState, useEffect } from 'react';

import { categoryFormAction } from '@/actions/dashboard/category/category-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { CategorySchema } from '@/schemas/category.schema';
import type { Category } from '@/types/category';

interface CategoryFormProps {
  category?: Category;
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const t = useTranslations('Dashboard.category');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; active: boolean }>>([]);

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      let query = supabase
        .from('category')
        .select('id, name, active')
        .eq('active', true)
        .order('name');

      try {
        const activeOrgId = window.localStorage.getItem('active_org_id');
        if (activeOrgId) {
          const orgIdNumber = Number(activeOrgId);
          if (!Number.isNaN(orgIdNumber)) {
            query = query.eq('organization_id', orgIdNumber);
          }
        }
      } catch {
        // ignore
      }

      if (category?.id) {
        query = query.neq('id', category.id);
      }

      const { data } = await query;
      if (data) {
        setCategories(data);
      }
    }

    loadCategories();
  }, [category?.id]);

  // Utils
  const [actionState, formAction, pending] = useActionState(categoryFormAction, EMPTY_ACTION_STATE);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      CategorySchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {category?.id && <input name="id" type="hidden" value={category.id} />}

      <div>
        <Label htmlFor="parent_id">{t('form.parentCategory')}</Label>
        <Select defaultValue={category?.parent_id ?? 'null'} name="parent_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.noParent')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">{t('form.noParent')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="parent_id" />
      </div>
      
      <div>
        <Label htmlFor="name">{t('form.nameLabel')}</Label>
        <Input
          aria-describedby="name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          defaultValue={category?.name ?? ''}
          id="name"
          name="name"
          placeholder={t('form.namePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">{t('form.descriptionLabel')}</Label>
        <Textarea
          aria-describedby="description-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.description}
          defaultValue={category?.description ?? ''}
          id="description"
          name="description"
          placeholder={t('form.descriptionPlaceholder')}
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded"
          defaultChecked={category?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">{t('form.activeLabel')}</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/category">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {category ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
