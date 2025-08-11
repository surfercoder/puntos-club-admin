import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/dashboard/product/product-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('product').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching product</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={data} />
        </CardContent>
      </Card>
    </div>
  );
}