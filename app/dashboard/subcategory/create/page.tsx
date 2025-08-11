import SubcategoryForm from '@/components/dashboard/subcategory/subcategory-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateSubcategoryPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          <SubcategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}