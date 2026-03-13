import { Pencil, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { getProducts } from '@/actions/dashboard/product/actions';
import DeleteModal from '@/components/dashboard/product/delete-modal';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
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
  const [{ data, error }, t, tCommon] = await Promise.all([
    getProducts(),
    getTranslations('Dashboard.product'),
    getTranslations('Common'),
  ]);

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <PlanLimitCreateButton
          features={['redeemable_products']}
          createHref="/dashboard/product/create"
          createLabel={t('newButton')}
        />
      </div>

      <PlanUsageBanner features={['redeemable_products']} />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.images')}</TableHead>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.description')}</TableHead>
              <TableHead>{t('tableHeaders.requiredPoints')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
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
                            key={url}
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
                      {product.active ? tCommon('active') : tCommon('inactive')}
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
                <TableCell className="text-center py-4" colSpan={6}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
