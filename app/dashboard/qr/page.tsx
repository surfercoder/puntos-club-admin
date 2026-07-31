import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { OrgQRDisplay } from '@/components/dashboard/qr/org-qr-display';
import { AppDownloadQRCards } from '@/components/mobile-apps/app-download-qr-cards';

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations('Metadata');
  return {
    title: tMeta('qrTitle'),
    description: tMeta('qrDescription'),
  };
}

export default async function QRPage() {
  const [supabase, t] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.qr'),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const currentUser = await getCurrentUser();
  // Validates the active_org_id cookie against membership and falls back to the
  // user's primary org — a stale cookie (e.g. a since-deleted org) otherwise
  // queries a phantom id and renders "orgNotFound".
  const organizationId = await getActiveOrgIdFilter(currentUser);

  if (!organizationId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">{t('noOrg')}</p>
          <Link href="/dashboard/organization" className="text-primary text-sm underline">
            {t('createOrg')}
          </Link>
        </div>
      </div>
    );
  }

  const { data: org } = await supabase
    .from('organization')
    .select('id, name, logo_url')
    .eq('id', organizationId)
    .single();

  if (!org) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">{t('orgNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium tracking-tight">{t('orgSectionTitle')}</h2>
        <OrgQRDisplay
          organizationId={Number(org.id)}
          organizationName={org.name}
          logoUrl={org.logo_url}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium tracking-tight">{t('downloadSectionTitle')}</h2>
        <AppDownloadQRCards />
      </section>
    </div>
  );
}
