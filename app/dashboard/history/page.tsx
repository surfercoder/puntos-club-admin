import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DeleteModal from '@/components/dashboard/history/delete-modal';
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

interface HistoryWithRelations {
  id: string;
  order_id: string;
  status_id?: string | null;
  change_date: string;
  observations?: string | null;
  app_order: {
    order_number: string;
  };
  status: {
    name: string;
  } | null;
}

export default async function HistoryListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('history')
    .select(`
      *,
      app_order:app_order(order_number),
      status:status(name)
    `)
    .order('change_date', { ascending: false });

  if (error) {
    return <div>Error fetching history records</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link className="text-sm font-medium text-gray-500 hover:text-blue-600" href="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">History</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-muted-foreground">Manage order history records in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/history/create">+ New History Record</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Change Date</TableHead>
              <TableHead>Observations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((history: HistoryWithRelations) => (
                <TableRow key={history.id}>
                  <TableCell className="font-medium">
                    {history.app_order?.order_number || 'N/A'}
                  </TableCell>
                  <TableCell>{history.status?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(history.change_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{history.observations || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/history/edit/${history.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        historyDescription={`${history.app_order?.order_number || 'N/A'} - ${new Date(history.change_date).toLocaleDateString()}`}
                        historyId={history.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={5}>No history records found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}