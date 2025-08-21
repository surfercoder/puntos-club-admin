"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteCategory } from '@/actions/dashboard/category/actions';
import { Button } from '@/components/ui/button';

interface DeleteModalProps {
  categoryId: string;
  categoryName: string;
}

export default function DeleteModal({ categoryId, categoryName }: DeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCategory(categoryId);
      if (result.error) {
        toast.error('Failed to delete category');
      } else {
        toast.success('Category deleted successfully');
        router.refresh();
      }
    } catch {
      toast.error('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
        <h3 className="text-lg font-semibold mb-4">Delete Category</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{categoryName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            disabled={isDeleting}
            onClick={() => setIsOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={handleDelete}
            variant="destructive"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
