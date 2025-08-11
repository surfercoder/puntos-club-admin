import { createClient } from '@/lib/supabase/server';
import SubcategoryForm from '@/components/dashboard/subcategory/subcategory-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditSubcategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('subcategory').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching subcategory</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          <SubcategoryForm subcategory={data} />
        </CardContent>
      </Card>
    </div>
  );
}