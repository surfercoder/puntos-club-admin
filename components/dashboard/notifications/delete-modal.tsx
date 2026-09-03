"use client";

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { deletePushNotification } from '@/actions/dashboard/push_notifications/actions';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/dashboard/shared/confirm-delete-dialog';

interface DeleteModalProps {
  notificationId: string;
  notificationTitle: string;
}

export default function DeleteModal({ notificationId, notificationTitle }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useRouter();
  const t = useTranslations('Dashboard.notifications.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePushNotification(notificationId);
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
      description={t.rich('confirm', {
        name: notificationTitle,
        strong: (chunks) => <strong>{chunks}</strong>,
      })}
      isDeleting={isDeleting}
      onConfirm={handleDelete}
      cancelLabel={tCommon('cancel')}
      confirmLabel={isDeleting ? tCommon('deleting') : tCommon('delete')}
    />
  );
}
