import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function OrganizationNotificationLimitsListPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('organization_notification_limits')
    .select('*, organization:organization_id(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error al obtener límites de notificaciones</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Límites de Notificaciones</h1>
          <p className="text-muted-foreground">Administrar límites de notificaciones y planes por organización</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/organization_notification_limits/create">+ Nuevo Límite</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organización</TableHead>
              <TableHead>Tipo de Plan</TableHead>
              <TableHead>Límite Diario</TableHead>
              <TableHead>Límite Mensual</TableHead>
              <TableHead>Horas Mín. Entre Envíos</TableHead>
              <TableHead>Enviadas Hoy</TableHead>
              <TableHead>Enviadas Este Mes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(limit.organization)
                      ? limit.organization[0]?.name
                      : limit.organization?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      limit.plan_type === 'premium' ? 'default' :
                      limit.plan_type === 'pro' ? 'outline' :
                      limit.plan_type === 'light' ? 'secondary' :
                      'secondary'
                    }>
                      {limit.plan_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{limit.daily_limit}</TableCell>
                  <TableCell>{limit.monthly_limit}</TableCell>
                  <TableCell>{limit.min_hours_between_notifications}h</TableCell>
                  <TableCell>{limit.notifications_sent_today}</TableCell>
                  <TableCell>{limit.notifications_sent_this_month}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/organization_notification_limits/${limit.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={8}>No se encontraron límites de notificaciones.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
