"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { productFormAction } from '@/actions/dashboard/product/product-form-actions';
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

interface ProductFormProps {
  product?: Product;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
}

export default function ProductForm({ product }: ProductFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(product?.category_id ?? '');

  // Utils
  const [actionState, formAction, pending] = useActionState(productFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

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
      if (data) {
        setCategories(data);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/product");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      ProductSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {product?.id && <input name="id" type="hidden" value={product.id} />}
      
      <div>
        <Label htmlFor="category_id">Category</Label>
        <select
          id="category_id"
          name="category_id"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="category_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.category_id}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="category_id" />
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          defaultValue={product?.name ?? ''}
          id="name"
          name="name"
          placeholder="Enter product name"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          defaultValue={product?.description ?? ''}
          id="description"
          name="description"
          placeholder="Enter product description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div>
        <Label htmlFor="required_points">Required Points</Label>
        <Input
          defaultValue={product?.required_points ?? 0}
          id="required_points"
          min="0"
          name="required_points"
          placeholder="Enter required points"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="required_points" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded border-gray-300"
          defaultChecked={product?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/product">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {product ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}