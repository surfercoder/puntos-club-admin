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
import { Textarea } from '@/components/ui/textarea';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { CategorySchema } from '@/schemas/category.schema';
import type { Category } from '@/types/category';

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
      {category?.id && <input name="id" type="hidden" value={category.id} />}
      
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
