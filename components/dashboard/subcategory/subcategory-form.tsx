"use client";

import { useActionState, useState, useEffect } from 'react';
import { subcategoryFormAction } from '@/actions/dashboard/subcategory/subcategory-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Subcategory } from '@/types/subcategory';
import { SubcategorySchema } from '@/schemas/subcategory.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
  const [selectedCategory, setSelectedCategory] = useState<string>(subcategory?.category_id || '');

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
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected category to form data
    if (selectedCategory) {
      formData.set('category_id', selectedCategory);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      category_id: formData.get('category_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      active: formData.get('active') === 'on',
    };

    try {
      SubcategorySchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {subcategory?.id && <input type="hidden" name="id" value={subcategory.id} />}
      
      <div>
        <Label htmlFor="category_id">Category</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory} name="category_id">
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
          id="name"
          name="name"
          type="text"
          defaultValue={subcategory?.name ?? ''}
          placeholder="Enter subcategory name"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={subcategory?.description ?? ''}
          placeholder="Enter subcategory description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={subcategory?.active ?? true}
          className="rounded border-gray-300"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/subcategory">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {subcategory ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}