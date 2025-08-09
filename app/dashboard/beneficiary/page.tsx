import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Beneficiary } from '@/types/beneficiary';
import DeleteModal from '@/components/dashboard/beneficiary/delete-modal';
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

export default async function BeneficiaryListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('beneficiary').select('*');

  if (error) {
    return <div>Error fetching beneficiaries</div>;
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
              <span className="text-sm font-medium text-gray-900">Beneficiaries</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Beneficiaries</h1>
          <p className="text-muted-foreground">Manage all beneficiaries in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/beneficiary/create">+ New Beneficiary</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Document ID</TableHead>
              <TableHead>Available Points</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((beneficiary: Beneficiary) => (
                <TableRow key={beneficiary.id}>
                  <TableCell className="font-medium">
                    {beneficiary.first_name || beneficiary.last_name 
                      ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{beneficiary.email || 'N/A'}</TableCell>
                  <TableCell>{beneficiary.phone || 'N/A'}</TableCell>
                  <TableCell>{beneficiary.document_id || 'N/A'}</TableCell>
                  <TableCell>{beneficiary.available_points}</TableCell>
                  <TableCell>
                    {new Date(beneficiary.registration_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/beneficiary/edit/${beneficiary.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        beneficiaryId={beneficiary.id}
                        beneficiaryName={
                          beneficiary.first_name || beneficiary.last_name 
                            ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
                            : 'Unnamed Beneficiary'
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No beneficiaries found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
