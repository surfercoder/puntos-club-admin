'use client';

import { useEffect } from 'react';

import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';
import type { NotificationFormAction } from './notification-form';

function formatTimeRemaining(limits: OrganizationNotificationLimit | null): string | null {
  /* c8 ignore next 3 -- unreachable: the only caller already guards both fields before starting the interval */
  if (!limits?.last_notification_sent_at || !limits?.min_hours_between_notifications) {
    return null;
  }

  const lastSent = new Date(limits.last_notification_sent_at);
  const minHours = limits.min_hours_between_notifications;
  const nextAvailable = new Date(lastSent.getTime() + minHours * 60 * 60 * 1000);
  const now = new Date();
  const diff = nextAvailable.getTime() - now.getTime();

  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Extracted from NotificationForm to keep the component's own control-flow
// complexity down; behavior is unchanged.
export function useNotificationCountdown(
  canSend: boolean | null,
  limits: OrganizationNotificationLimit | null,
  dispatch: (action: NotificationFormAction) => void,
) {
  useEffect(() => {
    if (!canSend && limits?.last_notification_sent_at && limits?.min_hours_between_notifications) {
      const interval = setInterval(() => {
        const remaining = formatTimeRemaining(limits);
        if (remaining) {
          dispatch({ type: 'UPDATE_TIMER', payload: remaining });
        } else {
          dispatch({ type: 'TIMER_EXPIRED' });
          window.location.reload();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [canSend, limits, dispatch]);
}
