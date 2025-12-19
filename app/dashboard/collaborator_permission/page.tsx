import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DeleteModal from '@/components/dashboard/collaborator_permission/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

interface CollaboratorPermissionWithRelations {
  id: string;
  collaborator_id: string;
  permission_type: string;
  can_execute: boolean | null;
  collaborator: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
}

export default async function CollaboratorPermissionListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collaborator_permission')
    .select(`
      *,
      collaborator:collaborator_id(first_name, last_name, email)
    `)
    .order('id', { ascending: false });

  if (error) {
    return <div>Error fetching collaborator permissions</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collaborator Permissions</h1>
          <p className="text-muted-foreground">Manage what collaborators can execute</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/collaborator_permission/create">+ New Collaborator Permission</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaborator</TableHead>
              <TableHead>Permission Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((row: CollaboratorPermissionWithRelations) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.collaborator?.first_name || row.collaborator?.last_name
                      ? `${row.collaborator.first_name || ''} ${row.collaborator.last_name || ''}`.trim()
                      : row.collaborator?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{row.permission_type}</TableCell>
                  <TableCell>{row.can_execute === false ? 'Disabled' : 'Enabled'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/collaborator_permission/edit/${row.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        collaboratorPermissionId={row.id}
                        collaboratorPermissionDescription={`${row.collaborator?.email || 'Collaborator'} - ${row.permission_type}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={4}>
                  No collaborator permissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
