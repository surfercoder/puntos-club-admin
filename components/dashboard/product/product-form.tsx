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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { ProductSchema } from '@/schemas/product.schema';
import type { Product } from '@/types/product';

interface ProductFormProps {
  product?: Product;
}

interface Subcategory {
  id: string;
  name: string;
  active: boolean;
}

export default function ProductForm({ product }: ProductFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(product?.subcategory_id || '');

  // Utils
  const [actionState, formAction, pending] = useActionState(productFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load subcategories
  useEffect(() => {
    async function loadSubcategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('subcategory')
        .select('id, name, active')
        .eq('active', true)
        .order('name');
      if (data) {
        setSubcategories(data);
      }
    }
    loadSubcategories();
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
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected subcategory to form data
    if (selectedSubcategory) {
      formData.set('subcategory_id', selectedSubcategory);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      subcategory_id: formData.get('subcategory_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      required_points: parseInt(formData.get('required_points') as string) || 0,
      active: formData.get('active') === 'on',
    };

    try {
      ProductSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {product?.id && <input name="id" type="hidden" value={product.id} />}
      
      <div>
        <Label htmlFor="subcategory_id">Subcategory</Label>
        <Select name="subcategory_id" onValueChange={setSelectedSubcategory} value={selectedSubcategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a subcategory" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="subcategory_id" />
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