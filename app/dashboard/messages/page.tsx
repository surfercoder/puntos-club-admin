import { ArrowLeft, MessagesSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { markPlatformMessagesRead } from '@/actions/dashboard/platform/actions';
import { MessageComposer } from '@/components/dashboard/platform/message-composer';
import { MessageThread } from '@/components/dashboard/platform/message-thread';
import { PlatformInbox } from '@/components/dashboard/platform/platform-inbox';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import type { PlatformMessage } from '@/types/platform';

export default async function PlatformMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const [t, user, params] = await Promise.all([
    getTranslations('Dashboard.platformMessages'),
    getCurrentUser(),
    searchParams,
  ]);
  if (!user) notFound();

  const supabase = await createClient();
  const viewerIsPlatform = isAdmin(user);
  const requestedOrg = Number(params.org);
  const orgId = viewerIsPlatform
    ? (Number.isInteger(requestedOrg) && requestedOrg > 0 ? requestedOrg : null)
    : await getActiveOrgIdFilter(user);

  const header = (
    <div className="flex items-center gap-3">
      <MessagesSquare className="size-7 text-primary" />
      <div>
        <h1 className="text-2xl font-semibold">{viewerIsPlatform ? t('adminTitle') : t('ownerTitle')}</h1>
        <p className="text-muted-foreground">{viewerIsPlatform ? t('adminDescription') : t('ownerDescription')}</p>
      </div>
    </div>
  );

  if (viewerIsPlatform && !orgId) {
    return (
      <div className="space-y-6">
        {header}
        <PlatformInbox />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="space-y-6">
        {header}
        <p className="text-muted-foreground">{t('noOrganization')}</p>
      </div>
    );
  }

  // Primero se marca leido y despues se lee, asi la campanita ya no lo cuenta.
  await markPlatformMessagesRead(orgId);
  const [{ data: messages }, { data: org }] = await Promise.all([
    supabase
      .from('platform_message')
      .select('*, sender:sender_id(first_name, last_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true }),
    supabase.from('organization').select('name').eq('id', orgId).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      {header}
      {viewerIsPlatform ? (
        <Link className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" href="/dashboard/messages">
          <ArrowLeft className="size-4" /> {t('backToInbox')}
        </Link>
      ) : null}
      <section className="space-y-4 rounded-lg border p-4">
        {viewerIsPlatform ? <h2 className="font-medium">{org?.name ?? `#${orgId}`}</h2> : null}
        <MessageThread messages={(messages ?? []) as PlatformMessage[]} viewerIsPlatform={viewerIsPlatform} />
        <MessageComposer organizationId={orgId} />
      </section>
    </div>
  );
}
