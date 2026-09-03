"use client";

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deletePushToken } from '@/actions/dashboard/push_tokens/actions';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/dashboard/shared/confirm-delete-dialog';

interface DeleteModalProps {
  tokenId: string;
  tokenLabel: string;
}

export default function DeleteModal({ tokenId, tokenLabel }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useRouter();
  const t = useTranslations('Dashboard.pushTokensCrud.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePushToken(tokenId);
      if (result.error) {
        toast.error(t('deleteError'));
      } else {
        toast.success(t('deleteSuccess'));
        refresh();
        setOpen(false);
      }
    } catch {
      toast.error(t('genericError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="destructive">
          <Trash2 className="size-4" />
        </Button>
      }
      title={t('title')}
      description={t.rich('confirm', { name: tokenLabel, strong: (chunks) => <strong>{chunks}</strong> })}
      isDeleting={isDeleting}
      onConfirm={handleDelete}
      cancelLabel={tCommon('cancel')}
      confirmLabel={isDeleting ? tCommon('loading') : tCommon('delete')}
    />
  );
}
