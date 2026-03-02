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
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PushTokensListPage() {
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  // Use admin client to bypass RLS for admin users
  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const { data, error } = await supabase
    .from('push_tokens')
    .select('*, beneficiary:beneficiary_id(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error al obtener tokens push</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tokens Push</h1>
          <p className="text-muted-foreground">Administrar tokens push de dispositivos de beneficiarios</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/push_tokens/create">+ Nuevo Token Push</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiario</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>ID de Dispositivo</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Creado el</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(token.beneficiary) 
                      ? `${token.beneficiary[0]?.first_name || ''} ${token.beneficiary[0]?.last_name || ''}`.trim() || token.beneficiary[0]?.email
                      : `${token.beneficiary?.first_name || ''} ${token.beneficiary?.last_name || ''}`.trim() || token.beneficiary?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{token.platform || 'N/A'}</TableCell>
                  <TableCell>{token.device_id || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{token.expo_push_token}</TableCell>
                  <TableCell>
                    <Badge variant={token.is_active ? 'default' : 'secondary'}>
                      {token.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(token.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/push_tokens/${token.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>No se encontraron tokens push.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
