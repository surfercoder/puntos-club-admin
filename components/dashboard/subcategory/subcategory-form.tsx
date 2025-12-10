"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { subcategoryFormAction } from '@/actions/dashboard/subcategory/subcategory-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { SubcategorySchema } from '@/schemas/subcategory.schema';
import type { Subcategory } from '@/types/subcategory';

interface SubcategoryFormProps {
  subcategory?: Subcategory;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
}

export default function SubcategoryForm({ subcategory }: SubcategoryFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Utils
  const [actionState, formAction, pending] = useActionState(subcategoryFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from('category')
        .select('id, name, active')
        .eq('active', true)
        .order('name');
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
        router.push("/dashboard/subcategory");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      SubcategorySchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {subcategory?.id && <input name="id" type="hidden" value={subcategory.id} />}
      
      <div>
        <Label htmlFor="category_id">Category</Label>
        <Select defaultValue={subcategory?.category_id ?? ''} name="category_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="category_id" />
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          defaultValue={subcategory?.name ?? ''}
          id="name"
          name="name"
          placeholder="Enter subcategory name"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          defaultValue={subcategory?.description ?? ''}
          id="description"
          name="description"
          placeholder="Enter subcategory description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded border-gray-300"
          defaultChecked={subcategory?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/subcategory">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {subcategory ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}