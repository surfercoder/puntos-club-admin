"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteAddress } from '@/actions/dashboard/address/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function DeleteModal({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('Dashboard.address.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAddress(id);
      toast.success(t('deleteSuccess'));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          {tCommon('delete')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('confirm')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button disabled={loading} onClick={() => setOpen(false)} type="button" variant="secondary">
            {tCommon('cancel')}
          </Button>
          <Button disabled={loading} onClick={handleDelete} type="button" variant="destructive">
            {loading ? tCommon('loading') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
