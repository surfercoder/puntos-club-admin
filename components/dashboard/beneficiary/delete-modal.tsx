"use client";

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteBeneficiary } from '@/actions/dashboard/beneficiary/actions';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/dashboard/shared/confirm-delete-dialog';

interface DeleteModalProps {
  beneficiaryId: string;
  beneficiaryName: string;
}

export default function DeleteModal({ beneficiaryId, beneficiaryName }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useRouter();
  const { invalidate } = usePlanUsage();
  const t = useTranslations('Dashboard.beneficiary.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBeneficiary(beneficiaryId);
      if (result.error) {
        toast.error(t('deleteError'));
      } else {
        toast.success(t('deleteSuccess'));
        invalidate();
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
      description={t.rich('confirm', { name: beneficiaryName, strong: (chunks) => <strong>{chunks}</strong> })}
      isDeleting={isDeleting}
      onConfirm={handleDelete}
      cancelLabel={tCommon('cancel')}
      confirmLabel={isDeleting ? tCommon('loading') : tCommon('delete')}
    />
  );
}
