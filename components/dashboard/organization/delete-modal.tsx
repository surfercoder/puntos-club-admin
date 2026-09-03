"use client";

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteOrganization } from '@/actions/dashboard/organization/actions';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/dashboard/shared/confirm-delete-dialog';

interface DeleteModalProps {
  organizationId: string;
  organizationName: string;
}

export default function DeleteModal({ organizationId, organizationName }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useRouter();
  const t = useTranslations('Dashboard.organization.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteOrganization(organizationId);
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
      description={t.rich('confirm', { name: organizationName, strong: (chunks) => <strong>{chunks}</strong> })}
      isDeleting={isDeleting}
      onConfirm={handleDelete}
      cancelLabel={tCommon('cancel')}
      confirmLabel={isDeleting ? tCommon('loading') : tCommon('delete')}
    />
  );
}
