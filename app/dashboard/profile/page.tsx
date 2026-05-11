import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { ProfileForm } from '@/components/dashboard/profile/profile-form';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const [supabase, t] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.profile'),
  ]);

  const [
    {
      data: { user },
    },
    currentUser,
  ] = await Promise.all([supabase.auth.getUser(), getCurrentUser()]);

  if (!user) {
    redirect('/auth/login');
  }

  if (!currentUser) {
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <ProfileForm user={currentUser} />
    </div>
  );
}
