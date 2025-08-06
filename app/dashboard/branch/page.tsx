import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteModal from '@/components/dashboard/branch/delete-modal';
import { Button } from '@/components/ui/button';
import type { BranchWithRelations } from '@/types/branch';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export default async function BranchListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('branch')
    .select(`
      *,
      organization:organization_id(name),
      address:address_id(street, city)
    `);

  if (error) {
    return <div>Error fetching branches</div>;
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
              <span className="text-sm font-medium text-gray-900">Branches</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-muted-foreground">Manage all branches in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/branch/create">+ New Branch</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((branch: BranchWithRelations) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.organization?.name || 'N/A'}</TableCell>
                  <TableCell>{branch.code || 'N/A'}</TableCell>
                  <TableCell>{branch.phone || 'N/A'}</TableCell>
                  <TableCell>
                    {branch.address 
                      ? `${branch.address.street}, ${branch.address.city}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      branch.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {branch.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/branch/edit/${branch.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteModal 
                        branchId={branch.id}
                        branchName={branch.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No branches found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
