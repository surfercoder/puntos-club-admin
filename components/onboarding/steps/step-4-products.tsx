'use client';

import { useState } from 'react';
import { Plus, Trash2, Package, Tag, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OnboardingStep4Data, OnboardingProductInput } from '@/actions/onboarding/actions';

interface ProductRow extends OnboardingProductInput {
  id: string;
}

interface Category {
  id: string;
  name: string;
  products: ProductRow[];
}

function createProduct(): ProductRow {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    required_points: 100,
    quantity: 10,
    minimum_quantity: 1,
  };
}

function createCategory(): Category {
  return {
    id: crypto.randomUUID(),
    name: '',
    products: [createProduct()],
  };
}

interface Step4Props {
  onNext: (data: OnboardingStep4Data | null) => void;
  onBack: () => void;
  initialData?: OnboardingStep4Data | null;
  onAutoSave?: (data: OnboardingStep4Data) => void;
}

function restoreCategories(data: OnboardingStep4Data): Category[] {
  return data.categories.map((cat) => ({
    id: crypto.randomUUID(),
    name: cat.name,
    products: cat.products.map((p) => ({
      id: crypto.randomUUID(),
      name: p.name,
      description: p.description ?? '',
      required_points: p.required_points,
      quantity: p.quantity,
      minimum_quantity: p.minimum_quantity ?? 1,
    })),
  }));
}

export function Step4Products({ onNext, onBack, initialData, onAutoSave }: Step4Props) {
  const t = useTranslations('Onboarding.step4');
  const tCommon = useTranslations('Common');

  const [categories, setCategories] = useState<Category[]>(() =>
    initialData?.categories.length ? restoreCategories(initialData) : [createCategory()]
  );

  const handleBack = () => {
    if (onAutoSave) {
      const snapshot = categories
        .filter((cat) => cat.name.trim() || cat.products.some((p) => p.name.trim()))
        .map((cat) => ({
          name: cat.name.trim(),
          products: cat.products
            .filter((p) => p.name.trim())
            .map((p) => ({
              name: p.name.trim(),
              description: p.description || undefined,
              required_points: Number(p.required_points) || 100,
              quantity: Number(p.quantity) || 0,
              minimum_quantity: Number(p.minimum_quantity) || 1,
            })),
        }));
      if (snapshot.length > 0) onAutoSave({ categories: snapshot });
    }
    onBack();
  };

  const updateCategory = (categoryId: string, name: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, name } : cat))
    );
  };

  const addCategory = () => {
    setCategories((prev) => [...prev, createCategory()]);
  };

  const removeCategory = (categoryId: string) => {
    if (categories.length === 1) return;
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
  };

  const addProduct = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, products: [...cat.products, createProduct()] }
          : cat
      )
    );
  };

  const removeProduct = (categoryId: string, productId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        if (cat.products.length === 1) return cat;
        return { ...cat, products: cat.products.filter((p) => p.id !== productId) };
      })
    );
  };

  const updateProduct = (
    categoryId: string,
    productId: string,
    field: keyof ProductRow,
    value: string | number
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          products: cat.products.map((p) =>
            p.id === productId ? { ...p, [field]: value } : p
          ),
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validCategories = categories.filter(
      (cat) => cat.name.trim() && cat.products.some((p) => p.name.trim())
    );

    if (validCategories.length === 0) {
      toast.error(t('validationError'));
      return;
    }

    onNext({
      categories: validCategories.map((cat) => ({
        name: cat.name.trim(),
        products: cat.products
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            description: p.description || undefined,
            required_points: Number(p.required_points) || 100,
            quantity: Number(p.quantity) || 0,
            minimum_quantity: Number(p.minimum_quantity) || 1,
          })),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Los <strong>premios</strong> son productos que tus clientes podrán canjear con sus puntos.
          Define los puntos necesarios y el stock disponible para cada premio.
        </span>
      </div>

      <div className="space-y-6">
        {categories.map((category, catIndex) => (
          <div
            key={category.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                {catIndex + 1}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor={`cat-${category.id}`} className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {t('categoryName')}
                </Label>
                <Input
                  id={`cat-${category.id}`}
                  placeholder="Ej: Bebidas, Snacks, Electrodomésticos..."
                  value={category.name}
                  onChange={(e) => updateCategory(category.id, e.target.value)}
                />
              </div>
              {categories.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => removeCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3 pl-10">
              {category.products.map((product, prodIndex) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      {t('rewardPlaceholder', { n: prodIndex + 1 })}
                    </div>
                    {category.products.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => removeProduct(category.id, product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        {tCommon('delete')}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">{t('rewardName')}</Label>
                      <Input
                        placeholder="Ej: Café mediano, Remera, Cargador..."
                        value={product.name}
                        onChange={(e) =>
                          updateProduct(category.id, product.id, 'name', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{t('pointsRequired')}</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        value={product.required_points}
                        onChange={(e) =>
                          updateProduct(
                            category.id,
                            product.id,
                            'required_points',
                            parseInt(e.target.value) || 100
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{t('initialStock')}</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="10"
                        value={product.quantity}
                        onChange={(e) =>
                          updateProduct(
                            category.id,
                            product.id,
                            'quantity',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed text-xs"
                onClick={() => addProduct(category.id)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t('addReward')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={addCategory}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t('addCategory')}
      </Button>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={handleBack} className="sm:flex-1">
          {tCommon('back')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onNext(null)}
          className="text-muted-foreground text-sm sm:flex-none"
        >
          {tCommon('skip')}
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 sm:flex-1">
          {tCommon('continue')}
        </Button>
      </div>
    </form>
  );
}
