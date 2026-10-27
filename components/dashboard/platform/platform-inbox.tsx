import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

import { MessageComposer } from '@/components/dashboard/platform/message-composer';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils';
import type { PlatformMessage } from '@/types/platform';

// ponytail: la bandeja agrupa en memoria los ultimos 500 mensajes; con mas
// organizaciones activas pasar a una vista SQL con DISTINCT ON.
const INBOX_LIMIT = 500;

type InboxRow = Pick<PlatformMessage, 'id' | 'organization_id' | 'body' | 'from_platform' | 'read_at' | 'created_at'> & {
  organization: { name: string } | { name: string }[] | null;
};

/** Bandeja del superadmin: un renglon por organizacion con su ultimo mensaje. */
export async function PlatformInbox() {
  const [t, locale, supabase] = await Promise.all([
    getTranslations('Dashboard.platformMessages'),
    getLocale(),
    createClient(),
  ]);
  const [{ data: rows }, { data: organizations }] = await Promise.all([
    supabase
      .from('platform_message')
      .select('id, organization_id, body, from_platform, read_at, created_at, organization:organization_id(name)')
      .order('created_at', { ascending: false })
      .limit(INBOX_LIMIT),
    supabase.from('organization').select('id, name').order('name'),
  ]);

  const conversations = new Map<number, { last: InboxRow; unread: number }>();
  for (const row of (rows ?? []) as InboxRow[]) {
    const conv = conversations.get(row.organization_id) ?? { last: row, unread: 0 };
    if (!row.from_platform && !row.read_at) conv.unread++;
    conversations.set(row.organization_id, conv);
  }

  return (
    <>
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 font-medium">{t('newMessage')}</h2>
        <MessageComposer organizations={(organizations ?? []).map((o) => ({ id: Number(o.id), name: o.name }))} />
      </section>
      <section className="rounded-lg border">
        {conversations.size === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">{t('emptyInbox')}</p>
        ) : (
          <ul className="divide-y">
            {[...conversations.values()].map(({ last, unread }) => {
              const org = Array.isArray(last.organization) ? last.organization[0] : last.organization;
              return (
                <li key={last.organization_id}>
                  <Link
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-accent"
                    href={`/dashboard/messages?org=${last.organization_id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{org?.name ?? `#${last.organization_id}`}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {last.from_platform ? `${t('you')}: ` : ''}{last.body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(last.created_at, locale, { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    {unread > 0 ? <Badge>{unread}</Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
