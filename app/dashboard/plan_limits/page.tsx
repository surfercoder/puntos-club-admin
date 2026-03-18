import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DeleteModal from '@/components/dashboard/plan_limits/delete-modal';
import ToastHandler from '@/components/dashboard/plan_limits/toast-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

export default async function PlanLimitsListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
    .order('plan')
    .order('feature');

  if (error) {
    return <div>Error loading plan limits</div>;
  }

  return (
    <div className="space-y-6">
      <ToastHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Limits</h1>
          <p className="text-muted-foreground">Manage plan feature limits</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plan_limits/create">+ New Plan Limit</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Warning Threshold</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell>
                    <Badge variant="secondary">{limit.plan}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{limit.feature}</TableCell>
                  <TableCell>{limit.limit_value}</TableCell>
                  <TableCell>{(limit.warning_threshold * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/plan_limits/edit/${limit.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal planLimitId={String(limit.id)} planLimitLabel={`${limit.plan} - ${limit.feature}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={5}>No plan limits found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
