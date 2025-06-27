import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Address } from '@/types/address';
import DeleteModal from '@/components/dashboard/address/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export default async function AddressListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('address').select('*');

  if (error) {
    return <div>Error fetching addresses</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <Button asChild>
          <Link href="/dashboard/address/create">+ New Address</Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Street</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Zip Code</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((address: Address) => (
                <TableRow key={address.id}>
                  <TableCell>{address.street}</TableCell>
                  <TableCell>{address.number}</TableCell>
                  <TableCell>{address.city}</TableCell>
                  <TableCell>{address.state}</TableCell>
                  <TableCell>{address.zip_code}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/dashboard/address/edit/${address.id}`}>Edit</Link>
                    </Button>
                    <DeleteModal id={Number(address.id)} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No addresses found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
