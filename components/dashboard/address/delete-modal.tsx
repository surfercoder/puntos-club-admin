'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAddress } from '@/actions/dashboard/address/actions';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DeleteModal({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    await deleteAddress(id);
    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Address?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this address? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading} type="button">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading} type="button">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
