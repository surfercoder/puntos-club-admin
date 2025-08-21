'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deleteAssignment } from '@/actions/dashboard/assignment/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function DeleteModal({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    await deleteAssignment(id);
    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Assignment?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this assignment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button disabled={loading} onClick={() => setOpen(false)} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleDelete} type="button" variant="destructive">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
