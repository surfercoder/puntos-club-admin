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
    return <div>Error al obtener productos</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Administrar productos del sistema</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/product/create">+ Nuevo Producto</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imágenes</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Puntos Requeridos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
                            className="relative w-12 h-12 rounded border overflow-hidden bg-muted"
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
                        <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
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
                      {product.active ? 'Activo' : 'Inactivo'}
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
                <TableCell className="text-center py-4" colSpan={6}>No se encontraron productos.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}