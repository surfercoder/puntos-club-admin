"use client";

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { deletePointsRule } from '@/actions/dashboard/points-rules/actions';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/dashboard/shared/confirm-delete-dialog';

interface DeleteModalProps {
  ruleId: number;
  ruleName: string;
  onDeleted?: () => void;
}

export default function DeleteModal({ ruleId, ruleName, onDeleted }: DeleteModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations('PointsRules.deleteModal');
  const tCommon = useTranslations('Common');

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePointsRule(ruleId);
      if (!result.success) {
        toast.error(result.error || t('deleteError'));
      } else {
        toast.success(t('deleteSuccess'));
        setOpen(false);
        onDeleted?.();
      }
    } catch {
      toast.error(t('genericError'));
    }
    setIsDeleting(false);
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
      description={t.rich('confirm', { name: ruleName, strong: (chunks) => <strong>{chunks}</strong> })}
      isDeleting={isDeleting}
      onConfirm={handleDelete}
      cancelLabel={tCommon('cancel')}
      confirmLabel={isDeleting ? tCommon('loading') : tCommon('delete')}
    />
  );
}
