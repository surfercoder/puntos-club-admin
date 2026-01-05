import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Package, ShoppingCart } from 'lucide-react';

import { getOrganization, getOrganizationProducts } from '@/actions/dashboard/organization/actions';
import { Button } from '@/components/ui/button';
import type { ProductWithRelations } from '@/types/product';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export default async function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const { data: organization, error: orgError } = await getOrganization(id);
  const { data: products, error: productsError } = await getOrganizationProducts(id);

  if (orgError || !organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-muted-foreground">Organization details and available products</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/organization/edit/${organization.id}`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Organization
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="text-base">{organization.business_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
              <p className="text-base">{organization.tax_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Creation Date</p>
              <p className="text-base">
                {new Date(organization.creation_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Available Products for Redemption
              </CardTitle>
              <CardDescription>
                Products that users can redeem with their points
              </CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/product">
                <Package className="h-4 w-4 mr-2" />
                Manage Products
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsError ? (
            <div className="text-center py-8 text-muted-foreground">
              Error loading products
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products available for redemption yet.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Required Points</TableHead>
                    <TableHead className="text-right">Available Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: ProductWithRelations) => {
                    const totalStock = product.stock?.reduce(
                      (sum: number, s) => sum + (s.quantity || 0),
                      0
                    ) || 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {product.description || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {product.category?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.required_points} pts
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            totalStock > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {totalStock > 0 ? `${totalStock} units` : 'Out of stock'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
