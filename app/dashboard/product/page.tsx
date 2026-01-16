import { Pencil, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { getProducts } from '@/actions/dashboard/product/actions';
import DeleteModal from '@/components/dashboard/product/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import type { Product } from '@/types/product';

export default async function ProductListPage() {
  const { data, error } = await getProducts();

  if (error) {
    return <div>Error fetching products</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage products in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/product/create">+ New Product</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Images</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Required Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        product.image_urls.map((url, index) => (
                          <div
                            key={index}
                            className="relative w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50"
                          >
                            <Image
                              src={url}
                              alt={`${product.name} image ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell>{product.description || 'N/A'}</TableCell>
                  <TableCell>{product.required_points}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/product/edit/${product.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={6}>No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}