'use client';

import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ModerationResult {
  isApproved: boolean;
  reasons?: string[];
  severity?: 'low' | 'medium' | 'high';
}

interface ModerationResultPanelProps {
  result: ModerationResult;
}

export default function ModerationResultPanel({ result }: ModerationResultPanelProps) {
  const t = useTranslations('Dashboard.notifications.moderation');

  return (
    <div className={`p-4 rounded-lg border ${
      result.isApproved
        ? 'bg-green-50 border-green-200'
        : result.severity === 'high'
        ? 'bg-red-50 border-red-200'
        : result.severity === 'medium'
        ? 'bg-orange-50 border-orange-200'
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start gap-3">
        {result.isApproved ? (
          <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">
            {result.isApproved ? `${t('contentApproved')} ✓` : t('contentNeedsReview')}
          </h3>
          {result.isApproved ? (
            <p className="text-sm text-green-800">
              {t('approvedMessage')}
            </p>
          ) : (
            <div className="text-sm space-y-2">
              <p className="font-medium text-red-900">{t('reviewReasons')}</p>
              <ul className="list-disc list-inside space-y-1 text-red-800">
                {result.reasons?.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="text-xs text-red-700 mt-2">
                {t('reminder')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
