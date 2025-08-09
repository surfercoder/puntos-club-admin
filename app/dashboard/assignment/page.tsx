import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AssignmentWithRelations } from '@/types/assignment';
import DeleteModal from '@/components/dashboard/assignment/delete-modal';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export default async function AssignmentListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignment')
    .select(`
      *,
      branch:branch_id(name),
      beneficiary:beneficiary_id(first_name, last_name),
      user:user_id(first_name, last_name)
    `);

  if (error) {
    return <div>Error fetching assignments</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">Assignments</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage all point assignments in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/assignment/create">+ New Assignment</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Assigned By</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Assignment Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((assignment: AssignmentWithRelations) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.branch?.name || 'N/A'}</TableCell>
                  <TableCell>
                    {assignment.beneficiary 
                      ? `${assignment.beneficiary.first_name} ${assignment.beneficiary.last_name}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {assignment.user 
                      ? `${assignment.user.first_name} ${assignment.user.last_name}`
                      : 'System'
                    }
                  </TableCell>
                  <TableCell>{assignment.points}</TableCell>
                  <TableCell>{assignment.reason || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(assignment.assignment_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/dashboard/assignment/edit/${assignment.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteModal id={assignment.id} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No assignments found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
