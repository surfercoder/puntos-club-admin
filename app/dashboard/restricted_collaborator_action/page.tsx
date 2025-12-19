import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DeleteModal from '@/components/dashboard/restricted_collaborator_action/delete-modal';
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

interface RestrictedCollaboratorActionRow {
  id: string;
  action_name: string;
  description: string | null;
}

export default async function RestrictedCollaboratorActionListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restricted_collaborator_action')
    .select('*')
    .order('action_name');

  if (error) {
    return <div>Error fetching restricted actions</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restricted Collaborator Actions</h1>
          <p className="text-muted-foreground">Manage actions collaborators are restricted from performing</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/restricted_collaborator_action/create">+ New Restricted Action</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((row: RestrictedCollaboratorActionRow) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.action_name}</TableCell>
                  <TableCell>{row.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/restricted_collaborator_action/edit/${row.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal restrictedActionId={row.id} restrictedActionName={row.action_name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={3}>
                  No restricted actions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
