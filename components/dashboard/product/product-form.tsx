"use client";

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from "sonner";

import { productFormAction } from '@/actions/dashboard/product/product-form-actions';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { ProductSchema } from '@/schemas/product.schema';
import type { Product } from '@/types/product';
import ProductImageUpload from './product-image-upload';

interface ProductFormProps {
  product?: Product;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
}

export default function ProductForm({ product }: ProductFormProps) {
  const t = useTranslations('Dashboard.product.form');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [categoryState, setCategoryState] = useState<{ items: Category[]; loaded: boolean }>({ items: [], loaded: false });
  const [selectedCategory, setSelectedCategory] = useState<string>(product?.category_id ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(product?.image_urls ?? []);

  // Utils
  const [actionState, formAction, pending] = useActionState(productFormAction, EMPTY_ACTION_STATE);
  const { invalidate: _invalidate } = usePlanUsage();

  // Load categories
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

      const { data } = await query;
      setCategoryState({ items: data ?? [], loaded: true });
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    // Redirect first, then invalidate plan usage cache.
    // If invalidate() runs before redirect(), the PlanLimitGuard may
    // re-render and block the page before the navigation occurs.
    redirect("/dashboard/product");
  }

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    const formDataWithImages = {
      ...formData,
      image_urls: imageUrls,
    };
    setValidation(null);

    try {
      ProductSchema.parse(formDataWithImages);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {product?.id && <input name="id" type="hidden" value={product.id} />}
      <input name="image_urls" type="hidden" value={JSON.stringify(imageUrls)} />
      
      <div>
        <Label htmlFor="category_id">{t('categoryLabel')}</Label>
        <select
          id="category_id"
          name="category_id"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="category_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.category_id}
        >
          <option value="">{t('categoryPlaceholder')}</option>
          {categoryState.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="category_id" />
      </div>

      <div>
        <Label htmlFor="name">{t('nameLabel')}</Label>
        <Input
          defaultValue={product?.name ?? ''}
          id="name"
          name="name"
          placeholder={t('namePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">{t('descriptionLabel')}</Label>
        <Textarea
          defaultValue={product?.description ?? ''}
          id="description"
          name="description"
          placeholder={t('descriptionPlaceholder')}
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div>
        <Label htmlFor="required_points">{t('pointsLabel')}</Label>
        <Input
          aria-describedby="required_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.required_points}
          defaultValue={product?.required_points ?? 0}
          id="required_points"
          name="required_points"
          placeholder={t('pointsPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="required_points" />
      </div>

      <div>
        <Label>{t('imagesLabel')}</Label>
        <ProductImageUpload
          productId={product?.id}
          initialImages={product?.image_urls ?? []}
          onImagesChange={setImageUrls}
        />
        <FieldError actionState={validation ?? actionState} name="image_urls" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded"
          defaultChecked={product?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">{t('activeLabel')}</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/product">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending || !categoryState.loaded} type="submit">
          {product ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}