import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

import DeleteModal from '@/components/dashboard/beneficiary/delete-modal';
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
import type { Beneficiary } from '@/types/beneficiary';

export default async function BeneficiaryListPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  let data: Beneficiary[] | null = null;
  let error = null;

  // Only filter by organization for non-admin users
  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    // Filter beneficiaries by organization
    const result = await supabase
      .from('beneficiary_organization')
      .select(`
        beneficiary:beneficiary_id(*)
      `)
      .eq('organization_id', activeOrgIdNumber);

    if (result.error) {
      error = result.error;
    } else {
      // Extract beneficiaries from the join result
      data = result.data
        ?.map((item) => item.beneficiary as unknown as Beneficiary | null)
        .filter((b): b is Beneficiary => b !== null) ?? null;
    }
  } else {
    // Admin users or no active organization selected - show all beneficiaries
    const result = await supabase.from('beneficiary').select('*');
    data = result.data;
    error = result.error;
  }

  if (error) {
    return <div>Error fetching beneficiaries</div>;
  }

  return (
    <div className="space-y-6">
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
                    {new Date(beneficiary.registration_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
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
                <TableCell className="text-center py-4" colSpan={7}>No beneficiaries found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
