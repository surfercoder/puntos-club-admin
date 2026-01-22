import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

export default async function PushTokensListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('push_tokens')
    .select('*, beneficiary:beneficiary_id(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error fetching push tokens</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Push Tokens</h1>
          <p className="text-muted-foreground">Manage device push tokens for beneficiaries</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/push_tokens/create">+ New Push Token</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(token.beneficiary) 
                      ? `${token.beneficiary[0]?.first_name || ''} ${token.beneficiary[0]?.last_name || ''}`.trim() || token.beneficiary[0]?.email
                      : `${token.beneficiary?.first_name || ''} ${token.beneficiary?.last_name || ''}`.trim() || token.beneficiary?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{token.platform || 'N/A'}</TableCell>
                  <TableCell>{token.device_id || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{token.expo_push_token}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      token.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {token.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(token.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/push_tokens/${token.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>No push tokens found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
