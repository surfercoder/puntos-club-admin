import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditAppUserPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.appUser'),
    params,
  ]);

  const { data, error } = await supabase.from('app_user').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  // `return` y no solo la llamada: abajo se usa data.organization_id, así que
  // acá tiene que cortar de verdad.
  if (!data) {
    return notFound();
  }

  // Sin esta lista el form esconde el selector de sucursal y un cajero ya creado
  // no se puede reasignar. Se filtra por la organización del usuario editado, no
  // por la activa: para un superadmin la activa puede ser otra.
  const { data: branchRows, error: branchError } = await supabase
    .from('branch')
    .select('id, name')
    .eq('organization_id', data.organization_id)
    .eq('active', true)
    .order('name');

  // Si la consulta falla, el form se dibujaría sin selector: igual que si la
  // organización no tuviera sucursales. Mejor avisar que mentir.
  if (branchError) {
    return <div>{t('fetchError')}</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserForm
            appUser={data}
            branches={(branchRows ?? []).map((branch) => ({
              id: String(branch.id),
              name: branch.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
