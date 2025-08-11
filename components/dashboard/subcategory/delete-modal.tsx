"use client";

import { useState } from 'react';
import { deleteSubcategory } from '@/actions/dashboard/subcategory/actions';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteModalProps {
  subcategoryId: string;
  subcategoryName: string;
}

export default function DeleteModal({ subcategoryId, subcategoryName }: DeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteSubcategory(subcategoryId);
      if (result.error) {
        toast.error('Failed to delete subcategory');
      } else {
        toast.success('Subcategory deleted successfully');
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
        variant="destructive"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
        <h3 className="text-lg font-semibold mb-4">Delete Subcategory</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{subcategoryName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}