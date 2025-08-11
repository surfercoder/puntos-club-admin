"use client";

import { useActionState, useState, useEffect } from 'react';
import { productFormAction } from '@/actions/dashboard/product/product-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Product } from '@/types/product';
import { ProductSchema } from '@/schemas/product.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      
      <div>
        <Label htmlFor="subcategory_id">Subcategory</Label>
        <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} name="subcategory_id">
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
          id="name"
          name="name"
          type="text"
          defaultValue={product?.name ?? ''}
          placeholder="Enter product name"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ''}
          placeholder="Enter product description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div>
        <Label htmlFor="required_points">Required Points</Label>
        <Input
          id="required_points"
          name="required_points"
          type="number"
          min="0"
          defaultValue={product?.required_points ?? 0}
          placeholder="Enter required points"
        />
        <FieldError actionState={validation ?? actionState} name="required_points" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={product?.active ?? true}
          className="rounded border-gray-300"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/product">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {product ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}