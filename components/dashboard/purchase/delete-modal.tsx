"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deletePurchase } from '@/actions/dashboard/purchase/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface DeleteModalProps {
  purchaseId: string;
  purchaseNumber: string;
}

export default function DeleteModal({ purchaseId, purchaseNumber }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePurchase(purchaseId);
      if (!result.success) {
        toast.error(result.error || 'Error deleting purchase');
      } else {
        toast.success('Purchase deleted successfully');
        router.refresh();
        setOpen(false);
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Purchase</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete purchase <strong>{purchaseNumber}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={isDeleting} onClick={() => setOpen(false)} variant="outline">Cancel</Button>
          <Button disabled={isDeleting} onClick={handleDelete} variant="destructive">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
