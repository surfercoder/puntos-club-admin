import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { OrgQRDisplay } from '@/components/dashboard/qr/org-qr-display';

export const metadata: Metadata = {
  title: 'Código QR | Panel',
  description: 'Código QR de tu organización para que los clientes se unan al programa de puntos',
};

export default async function QRPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const currentUser = await getCurrentUser();

  // Get active org from cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;

  // Try to resolve org from cookie, then from user's organization
  let organizationId: number | null = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!organizationId && currentUser?.organization?.id) {
    organizationId = Number(currentUser.organization.id);
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No se encontró ninguna organización activa.</p>
          <a href="/dashboard/organization" className="text-emerald-600 text-sm underline">
            Crear organización
          </a>
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
        <p className="text-muted-foreground">Organización no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Código QR</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Imprime o comparte este código para que tus clientes se unan a{' '}
          <strong>{org.name}</strong> y empiecen a acumular puntos.
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
