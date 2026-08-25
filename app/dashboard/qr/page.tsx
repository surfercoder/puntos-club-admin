import { ShieldAlert } from 'lucide-react';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium tracking-tight">{t('orgSectionTitle')}</h2>
        {/* OrgQRDisplay ya trae la guía de uso y los consejos: no los repetimos acá. */}
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

      <p className="flex items-start gap-3 rounded-xl border bg-brand-violet/5 p-5 text-sm">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-brand-violet" />
        <span>
          <span className="block font-semibold">{t('important.title')}</span>
          <span className="block text-xs text-muted-foreground">{t('important.body')}</span>
        </span>
      </p>
    </div>
  );
}
