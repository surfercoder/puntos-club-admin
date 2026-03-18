'use client';

import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';

interface NotificationLimitsPanelProps {
  limits: OrganizationNotificationLimit;
  canSend: boolean | null;
  timeRemaining: string;
}

function useRestrictionReason(limits: OrganizationNotificationLimit) {
  const t = useTranslations('Dashboard.notifications.limits');

  if (limits.notifications_sent_today >= limits.daily_limit) {
    return {
      type: 'daily_limit' as const,
      message: t('dailyLimitReached'),
      detail: t('dailyLimitDetail', { limit: limits.daily_limit }),
      action: t('dailyLimitAction'),
      resetTime: new Date(limits.reset_daily_at),
      nextAvailable: undefined as Date | undefined,
    };
  }

  if (limits.notifications_sent_this_month >= limits.monthly_limit) {
    return {
      type: 'monthly_limit' as const,
      message: t('monthlyLimitReached'),
      detail: t('monthlyLimitDetail', { limit: limits.monthly_limit }),
      action: t('monthlyLimitAction'),
      resetTime: new Date(limits.reset_monthly_at),
      nextAvailable: undefined as Date | undefined,
    };
  }

  if (limits.last_notification_sent_at) {
    const lastSent = new Date(limits.last_notification_sent_at);
    const minHours = limits.min_hours_between_notifications;
    const nextAvailable = new Date(lastSent.getTime() + minHours * 60 * 60 * 1000);
    const now = new Date();

    if (now < nextAvailable) {
      return {
        type: 'time_restriction' as const,
        message: t('timeRestriction'),
        detail: t('timeRestrictionDetail', { hours: minHours }),
        action: t('timeRestrictionAction'),
        nextAvailable,
        resetTime: undefined as Date | undefined,
      };
    }
  }

  return null;
}

export default function NotificationLimitsPanel({ limits, canSend, timeRemaining }: NotificationLimitsPanelProps) {
  const t = useTranslations('Dashboard.notifications.limits');
  const locale = useLocale();
  const restrictionReason = useRestrictionReason(limits);

  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  return (
    <div className={`p-4 rounded-lg border ${canSend ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-start gap-3">
        {canSend ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-2">
            {canSend ? t('readyToSend') : t('limitReached')}
          </h3>
          <div className="text-sm space-y-2">
            <p>
              <strong>{t('plan')}</strong> {limits.plan_type.charAt(0).toUpperCase() + limits.plan_type.slice(1)}
            </p>
            <p>
              <strong>{t('today')}</strong> {limits.notifications_sent_today} / {limits.daily_limit} {t('sent')}
            </p>
            <p>
              <strong>{t('thisMonth')}</strong> {limits.notifications_sent_this_month} / {limits.monthly_limit} {t('sent')}
            </p>
            {limits.last_notification_sent_at && (
              <p>
                <strong>{t('lastSent')}</strong> {new Date(limits.last_notification_sent_at).toLocaleString(dateLocale, dateOptions)}
              </p>
            )}

            {!canSend && restrictionReason && (
              <div className="mt-3 pt-3 border-t border-yellow-300">
                <div className="flex items-start gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">{restrictionReason.message}</p>
                    <p className="text-yellow-800 mt-1">{restrictionReason.detail}</p>
                  </div>
                </div>

                {restrictionReason.type === 'time_restriction' && timeRemaining && (
                  <div className="bg-yellow-100 rounded-md p-2 mt-2">
                    <p className="text-sm font-mono font-semibold text-yellow-900">
                      ⏱️ {t('timeRemaining')} {timeRemaining}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {t('nextAvailable')} {restrictionReason.nextAvailable?.toLocaleString(dateLocale, dateOptions)}
                    </p>
                  </div>
                )}

                {restrictionReason.type === 'daily_limit' && (
                  <div className="bg-yellow-100 rounded-md p-2 mt-2">
                    <p className="text-xs text-yellow-700">
                      ⏱️ {t('dailyReset')} {restrictionReason.resetTime?.toLocaleString(dateLocale, dateOptions)}
                    </p>
                  </div>
                )}

                {restrictionReason.type === 'monthly_limit' && (
                  <div className="bg-yellow-100 rounded-md p-2 mt-2">
                    <p className="text-xs text-yellow-700">
                      ⏱️ {t('monthlyReset')} {restrictionReason.resetTime?.toLocaleString(dateLocale, dateOptions)}
                    </p>
                  </div>
                )}

                <p className="text-xs text-yellow-800 mt-2">
                  💡 <strong>{t('whatToDo')}</strong> {restrictionReason.action}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
