"use client";

import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { cancelRedemption, deliverRedemption } from '@/actions/dashboard/redemption/actions';
import { Button } from '@/components/ui/button';

interface PendingRedemptionActionsProps {
  redemptionId: string;
}

export function PendingRedemptionActions({ redemptionId }: PendingRedemptionActionsProps) {
  const t = useTranslations('Dashboard.redemption');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDeliver = () => {
    startTransition(async () => {
      const { error } = await deliverRedemption(redemptionId);
      if (error) {
        toast.error(t('actionError'));
        return;
      }
      toast.success(t('deliverSuccess'));
      router.refresh();
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const { error } = await cancelRedemption(redemptionId);
      if (error) {
        toast.error(t('actionError'));
        return;
      }
      toast.success(t('cancelSuccess'));
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button disabled={pending} onClick={handleDeliver} size="sm" variant="default">
        <CheckCircle2 className="size-4" />
        <span className="ml-1 hidden md:inline">{t('deliverButton')}</span>
      </Button>
      <Button disabled={pending} onClick={handleCancel} size="sm" variant="outline">
        <XCircle className="size-4" />
        <span className="ml-1 hidden md:inline">{t('cancelButton')}</span>
      </Button>
    </div>
  );
}
