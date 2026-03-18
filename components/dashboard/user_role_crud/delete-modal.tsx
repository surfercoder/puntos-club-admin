"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteUserRole } from '@/actions/dashboard/user-role/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface DeleteModalProps {
  roleId: string;
  roleName: string;
}

export default function DeleteModal({ roleId, roleName }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUserRole(roleId);
      if (!result.success) {
        toast.error(result.error || 'Error deleting user role');
      } else {
        toast.success('User role deleted successfully');
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
          <DialogTitle>Delete User Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete role <strong>{roleName}</strong>? This action cannot be undone. Make sure no users are assigned to this role.
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
