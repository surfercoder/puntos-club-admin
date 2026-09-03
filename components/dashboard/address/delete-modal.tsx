"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteAddress } from '@/actions/dashboard/address/actions';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/dashboard/shared/confirm-delete-dialog';

export default function DeleteModal({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refresh } = useRouter();
  const t = useTranslations('Dashboard.address.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAddress(id);
      toast.success(t('deleteSuccess'));
      setOpen(false);
      refresh();
    } catch {
      toast.error(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="destructive">
          {tCommon('delete')}
        </Button>
      }
      title={t('title')}
      description={t('confirm')}
      isDeleting={loading}
      onConfirm={handleDelete}
      cancelLabel={tCommon('cancel')}
      confirmLabel={loading ? tCommon('loading') : tCommon('delete')}
      cancelVariant="secondary"
      buttonType="button"
      footerClassName="flex gap-2 justify-end"
    />
  );
}
