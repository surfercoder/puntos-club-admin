import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Package, ShoppingCart } from 'lucide-react';

import { getOrganization, getOrganizationProducts } from '@/actions/dashboard/organization/actions';
import { Badge } from '@/components/ui/badge';
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
          <p className="text-muted-foreground">Detalles de la organización y productos disponibles</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/organization/edit/${organization.id}`}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Organización
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Organización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
              <p className="text-base">{organization.business_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CUIT/RUT</p>
              <p className="text-base">{organization.tax_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p className="text-base">
                {new Date(organization.creation_date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
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
                Productos Disponibles para Canje
              </CardTitle>
              <CardDescription>
                Productos que los usuarios pueden canjear con sus puntos
              </CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/product">
                <Package className="h-4 w-4 mr-2" />
                Administrar Productos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsError ? (
            <div className="text-center py-8 text-muted-foreground">
              Error al cargar productos
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aún no hay productos disponibles para canje.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Producto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Puntos Requeridos</TableHead>
                    <TableHead className="text-right">Stock Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: ProductWithRelations) => {
                    const totalStock = product.stock?.reduce(
                      (sum: number, s) => sum + (s.quantity /* c8 ignore next */ || 0),
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
                          <Badge variant="outline">
                            {product.required_points} pts
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={totalStock > 0 ? 'default' : 'destructive'}>
                            {totalStock > 0 ? `${totalStock} unidades` : 'Sin stock'}
                          </Badge>
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
