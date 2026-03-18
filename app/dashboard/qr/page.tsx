import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { OrgQRDisplay } from '@/components/dashboard/qr/org-qr-display';

export async function generateMetadata(): Promise<Metadata> {
  const tMeta = await getTranslations('Metadata');
  return {
    title: tMeta('qrTitle'),
    description: tMeta('qrDescription'),
  };
}

export default async function QRPage() {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.qr');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const currentUser = await getCurrentUser();

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;

  let organizationId: number | null = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!organizationId && currentUser?.organization?.id) {
    organizationId = Number(currentUser.organization.id);
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">{t('noOrg')}</p>
          <Link href="/dashboard/organization" className="text-emerald-600 text-sm underline">
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
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('description')} <strong>{org.name}</strong>
        </p>
      </div>

      <OrgQRDisplay
        organizationId={Number(org.id)}
        organizationName={org.name}
        logoUrl={org.logo_url}
      />
    </div>
  );
}
