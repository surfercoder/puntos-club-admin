"use client";

import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { setOrganizationHidden } from '@/actions/dashboard/organization/actions';
import { Button } from '@/components/ui/button';

interface HiddenToggleProps {
  organizationId: string;
  hidden: boolean;
}

export default function HiddenToggle({ organizationId, hidden }: HiddenToggleProps) {
  const [isPending, startTransition] = useTransition();
  const { refresh } = useRouter();
  const t = useTranslations('Dashboard.organization.hide');

  const handleClick = () => {
    startTransition(async () => {
      const result = await setOrganizationHidden(organizationId, !hidden);
      if (result.error) {
        toast.error(t('error'));
      } else {
        toast.success(hidden ? t('shownSuccess') : t('hiddenSuccess'));
        refresh();
      }
    });
  };

  return (
    <Button
      aria-label={hidden ? t('show') : t('hide')}
      disabled={isPending}
      onClick={handleClick}
      size="sm"
      title={hidden ? t('show') : t('hide')}
      variant="outline"
    >
      {hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </Button>
  );
}
