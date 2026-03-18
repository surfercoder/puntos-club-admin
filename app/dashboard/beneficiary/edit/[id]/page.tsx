import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BeneficiaryForm from '@/components/dashboard/beneficiary/beneficiary-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';

export default async function EditBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, currentUser, t] = await Promise.all([
    createClient(),
    getCurrentUser(),
    getTranslations('Dashboard.beneficiary'),
  ]);

  if (!isAdmin(currentUser)) {
    redirect('/dashboard/beneficiary');
  }
  const id = (await params).id;
  const { data, error } = await supabase.from('beneficiary').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryForm beneficiary={data} />
        </CardContent>
      </Card>
    </div>
  );
}
