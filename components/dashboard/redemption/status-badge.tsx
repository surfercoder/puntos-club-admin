import { useTranslations } from 'next-intl';

import type { RedemptionStatus } from '@/types/redemption';

const STYLES: Record<RedemptionStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-gray-200 text-gray-700 border-gray-300',
};

export function RedemptionStatusBadge({ status }: { status: RedemptionStatus | null | undefined }) {
  const t = useTranslations('Dashboard.redemption.status');
  const safeStatus: RedemptionStatus = status ?? 'delivered';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[safeStatus]}`}
    >
      {t(safeStatus)}
    </span>
  );
}
