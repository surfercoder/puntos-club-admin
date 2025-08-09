import { createClient } from '@/lib/supabase/server';
import CategoryForm from '@/components/dashboard/category/category-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('category').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching category</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm category={data} />
        </CardContent>
      </Card>
    </div>
  );
}
