'use client';

import { EyeOff, Eye, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function HideButton({
  beneficiaryId,
  organizationId,
  isHidden,
}: {
  beneficiaryId: string;
  organizationId: string;
  isHidden: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('Dashboard.beneficiary.hide');

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/beneficiary/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiary_id: beneficiaryId,
          organization_id: organizationId,
          is_hidden: !isHidden,
        }),
      });

      if (res.ok) {
        toast.success(isHidden ? t('unhideSuccess') : t('hideSuccess'));
        router.refresh();
      } else {
        toast.error(t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={isHidden ? 'ghost' : 'outline'}
            className={isHidden ? '!bg-green-600 hover:!bg-green-700 !text-white shadow-sm' : ''}
            onClick={handleToggle}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isHidden ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isHidden ? t('unhideTooltip') : t('hideTooltip')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
