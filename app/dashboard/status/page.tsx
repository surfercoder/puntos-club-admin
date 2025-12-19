import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DeleteModal from '@/components/dashboard/status/delete-modal';
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
import type { Status } from '@/types/status';

export default async function StatusListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('status').select('*').order('order_num');

  if (error) {
    return <div>Error fetching statuses</div>;
  }

  return (
    <div className="space-y-6">      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Statuses</h1>
          <p className="text-muted-foreground">Manage order statuses in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/status/create">+ New Status</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Terminal</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((status: Status) => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">
                    {status.order_num}
                  </TableCell>
                  <TableCell className="font-medium">
                    {status.name}
                  </TableCell>
                  <TableCell>{status.description || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status.is_terminal 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {status.is_terminal ? 'Terminal' : 'In Progress'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/status/edit/${status.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        statusId={status.id}
                        statusName={status.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={5}>No statuses found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
