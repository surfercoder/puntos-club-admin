import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Subcategory } from '@/types/subcategory';
import DeleteModal from '@/components/dashboard/subcategory/delete-modal';
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

export default async function SubcategoryListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('subcategory').select('*').order('name');

  if (error) {
    return <div>Error fetching subcategories</div>;
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
              <span className="text-sm font-medium text-gray-900">Subcategories</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subcategories</h1>
          <p className="text-muted-foreground">Manage product subcategories in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/subcategory/create">+ New Subcategory</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((subcategory: Subcategory) => (
                <TableRow key={subcategory.id}>
                  <TableCell className="font-medium">
                    {subcategory.name}
                  </TableCell>
                  <TableCell>{subcategory.description || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subcategory.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subcategory.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/subcategory/edit/${subcategory.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        subcategoryId={subcategory.id}
                        subcategoryName={subcategory.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No subcategories found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}