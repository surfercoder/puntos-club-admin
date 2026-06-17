import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Package, ShoppingCart } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';

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
  const [
    { data: organization, error: orgError },
    { data: products, error: productsError },
  ] = await Promise.all([getOrganization(id), getOrganizationProducts(id)]);

  if (orgError || !organization) {
    notFound();
  }

  const [t, locale] = await Promise.all([
    getTranslations('Dashboard.organization.detailPage'),
    getLocale(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{organization.name}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/organization/edit/${organization.id}`}>
            <Pencil className="size-4 mr-2" />
            {t('editButton')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('infoSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('nameLabel')}</p>
              <p className="text-base">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('legalNameLabel')}</p>
              <p className="text-base">{organization.business_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('taxIdLabel')}</p>
              <p className="text-base">{organization.tax_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('createdAtLabel')}</p>
              <p className="text-base" suppressHydrationWarning>
                {new Date(organization.creation_date).toLocaleDateString(locale === 'es' ? 'es-AR' : 'en-US', { timeZone: 'UTC' })}
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
                <ShoppingCart className="size-5" />
                {t('productsTitle')}
              </CardTitle>
              <CardDescription>
                {t('productsDescription')}
              </CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/product">
                <Package className="size-4 mr-2" />
                {t('manageProducts')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsError ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('productsFetchError')}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noProducts')}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('productNameHeader')}</TableHead>
                    <TableHead>{t('descriptionHeader')}</TableHead>
                    <TableHead>{t('categoryHeader')}</TableHead>
                    <TableHead className="text-right">{t('pointsRequiredHeader')}</TableHead>
                    <TableHead className="text-right">{t('availableStockHeader')}</TableHead>
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
                            {product.required_points} {t('pointsUnit')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={totalStock > 0 ? 'default' : 'destructive'}>
                            {totalStock > 0 ? t('unitsLabel', { count: totalStock }) : t('outOfStock')}
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
