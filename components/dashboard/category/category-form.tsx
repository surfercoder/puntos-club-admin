"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

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
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/category");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

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
        <Label htmlFor="parent_id">Parent Category</Label>
        <Select defaultValue={category?.parent_id ?? ''} name="parent_id">
          <SelectTrigger>
            <SelectValue placeholder="No parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No parent</SelectItem>
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
        <Label htmlFor="name">Name</Label>
        <Input
          aria-describedby="name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          defaultValue={category?.name ?? ''}
          id="name"
          name="name"
          placeholder="Enter category name"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          aria-describedby="description-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.description}
          defaultValue={category?.description ?? ''}
          id="description"
          name="description"
          placeholder="Enter category description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded border-gray-300"
          defaultChecked={category?.active ?? true}
          id="active"
          name="active"
          type="checkbox"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/category">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
