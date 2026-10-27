import { getLocale, getTranslations } from 'next-intl/server';

import { cn, formatDateTime } from '@/lib/utils';
import type { PlatformMessage } from '@/types/platform';

/**
 * Hilo superadmin <-> organizacion, del mas viejo al mas nuevo. `viewerIsPlatform`
 * decide de que lado cae cada burbuja: lo propio a la derecha.
 */
export async function MessageThread({
  messages,
  viewerIsPlatform,
}: {
  messages: PlatformMessage[];
  viewerIsPlatform: boolean;
}) {
  const [t, locale] = await Promise.all([getTranslations('Dashboard.platformMessages'), getLocale()]);

  if (messages.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('emptyThread')}</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((m) => {
        const mine = m.from_platform === viewerIsPlatform;
        const author = m.from_platform
          ? t('platformName')
          : `${m.sender?.first_name ?? ''} ${m.sender?.last_name ?? ''}`.trim() || t('orgTeam');
        return (
          <li key={m.id} className={cn('flex flex-col max-w-[80%]', mine ? 'self-end items-end' : 'self-start items-start')}>
            <div
              className={cn(
                'whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm',
                mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {m.body}
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              {author} · {formatDateTime(m.created_at, locale, { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
