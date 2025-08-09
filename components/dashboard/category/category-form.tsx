"use client";

import { useActionState, useState, useEffect } from 'react';
import { categoryFormAction } from '@/actions/dashboard/category/category-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Category } from '@/types/category';
import { CategorySchema } from '@/schemas/category.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CategoryFormProps {
  category?: Category;
}

export default function CategoryForm({ category }: CategoryFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

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
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Transform form data to match schema expectations
    const transformedData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      active: formData.get('active') === 'on',
    };

    try {
      CategorySchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {category?.id && <input type="hidden" name="id" value={category.id} />}
      
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={category?.name ?? ''}
          placeholder="Enter category name"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={category?.description ?? ''}
          placeholder="Enter category description (optional)"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="description" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={category?.active ?? true}
          className="rounded border-gray-300"
        />
        <Label htmlFor="active">Active</Label>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/category">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
