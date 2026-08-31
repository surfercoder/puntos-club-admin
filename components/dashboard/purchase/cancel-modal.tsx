"use client";

import { XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { cancelPurchase } from '@/actions/dashboard/purchase/actions';
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

interface CancelModalProps {
  purchaseId: string;
  purchaseNumber: string;
}

export default function CancelModal({ purchaseId, purchaseNumber }: CancelModalProps) {
  const [open, setOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { refresh } = useRouter();
  const t = useTranslations('Dashboard.purchase.cancelModal');
  const tCommon = useTranslations('Common');

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelPurchase(purchaseId);
      if (!result.success) {
        toast.error(result.error || t('cancelError'));
      } else {
        toast.success(t('cancelSuccess'));
        refresh();
        setOpen(false);
      }
    } catch {
      toast.error(t('genericError'));
    }
    setIsCancelling(false);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          aria-label={t('trigger', { name: purchaseNumber })}
          size="icon-sm"
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <XCircle className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t.rich('confirm', { name: purchaseNumber, strong: (chunks) => <strong>{chunks}</strong> })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={isCancelling} onClick={() => setOpen(false)} variant="outline">
            {tCommon('cancel')}
          </Button>
          <Button disabled={isCancelling} onClick={handleCancel} variant="destructive">
            {isCancelling ? tCommon('loading') : t('confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
