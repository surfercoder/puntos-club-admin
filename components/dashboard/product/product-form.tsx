"use client";

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect, useReducer } from 'react';
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
import { ProductPreview } from './product-preview';
import ProductImageUpload from './product-image-upload';

const DESCRIPTION_MAX = 250;

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
  type CategoryState = { items: Category[]; loaded: boolean };
  const [categoryState, setCategoryState] = useReducer((_: CategoryState, next: CategoryState) => next, { items: [], loaded: false } as CategoryState);
  const [selectedCategory, setSelectedCategory] = useState<string>(product?.category_id ?? '');
  const [newCategory, setNewCategory] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(product?.image_urls ?? []);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [points, setPoints] = useState(String(product?.required_points ?? 0));
  const [stock, setStock] = useState(String(product?.stock ?? 0));

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
    if (actionState.status === 'success') {
      toast.success(actionState.message);
      redirect("/dashboard/product");
    }
  }, [actionState]);

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

  const categoryName =
    newCategory.trim() ||
    categoryState.items.find((c) => String(c.id) === selectedCategory)?.name ||
    '';

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      {product?.id && <input name="id" type="hidden" value={product.id} />}
      <input name="image_urls" type="hidden" value={JSON.stringify(imageUrls)} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t('sectionTitle')}</h2>

          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <Label htmlFor="category_id">{t('categoryLabel')}</Label>
                  <span className="text-xs text-muted-foreground">{t('orCreateCategory')}</span>
                </div>
                <select
                  id="category_id"
                  name="category_id"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1.5 flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Label htmlFor="new_category">{t('newCategoryLabel')}</Label>
                <Input
                  className="mt-1.5"
                  id="new_category"
                  name="new_category"
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t('newCategoryPlaceholder')}
                  type="text"
                  value={newCategory}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">
                  {t('nameLabel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="mt-1.5"
                  id="name"
                  name="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  type="text"
                  value={name}
                />
                <FieldError actionState={validation ?? actionState} name="name" />
              </div>

              <div>
                <Label htmlFor="description">{t('descriptionLabel')}</Label>
                <Textarea
                  className="mt-1.5"
                  id="description"
                  maxLength={DESCRIPTION_MAX}
                  name="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  value={description}
                />
                <p className="mt-1.5 text-right text-xs text-muted-foreground">
                  {t('descriptionMax', { max: DESCRIPTION_MAX })}
                </p>
                <FieldError actionState={validation ?? actionState} name="description" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="required_points">
                  {t('pointsLabel')} <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5 flex">
                  <Input
                    aria-describedby="required_points-error"
                    aria-invalid={!!(validation ?? actionState).fieldErrors?.required_points}
                    className="rounded-r-none"
                    id="required_points"
                    min={0}
                    name="required_points"
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder={t('pointsPlaceholder')}
                    type="number"
                    value={points}
                  />
                  <span className="grid place-items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                    pts
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{t('pointsHelp')}</p>
                <FieldError actionState={validation ?? actionState} name="required_points" />
              </div>

              <div>
                <Label htmlFor="stock">
                  {t('stockLabel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  aria-describedby="stock-error"
                  aria-invalid={!!(validation ?? actionState).fieldErrors?.stock}
                  className="mt-1.5"
                  id="stock"
                  min={0}
                  name="stock"
                  onChange={(e) => setStock(e.target.value)}
                  placeholder={t('stockPlaceholder')}
                  type="number"
                  value={stock}
                />
                <input defaultValue={product?.stock ?? 0} name="stock_loaded" type="hidden" />
                <p className="mt-1.5 text-xs text-muted-foreground">{t('stockHelp')}</p>
                <FieldError actionState={validation ?? actionState} name="stock" />
              </div>
            </div>

            <div>
              <Label>{t('imagesLabel')}</Label>
              <div className="mt-1.5">
                <ProductImageUpload
                  productId={product?.id}
                  initialImages={product?.image_urls ?? []}
                  onImagesChange={setImageUrls}
                />
              </div>
              <FieldError actionState={validation ?? actionState} name="image_urls" />
            </div>

            <div className="flex justify-end gap-3 border-t pt-5">
              <Button asChild type="button" variant="secondary">
                <Link href="/dashboard/product">{tCommon('cancel')}</Link>
              </Button>
              <Button disabled={pending || !categoryState.loaded} type="submit">
                {product ? t('submitEdit') : t('submitCreate')}
              </Button>
            </div>
          </div>
        </section>

        <ProductPreview
          data={{
            name,
            description,
            category: categoryName,
            points: Number(points) || 0,
            stock: Number(stock) || 0,
            imageUrl: imageUrls[0] ?? null,
          }}
        />
      </div>
    </form>
  );
}
