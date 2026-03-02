'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { deleteAddress } from '@/actions/dashboard/address/actions';
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
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">Eliminar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar Dirección?</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button disabled={loading} onClick={() => setOpen(false)} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={loading} onClick={handleDelete} type="button" variant="destructive">
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
