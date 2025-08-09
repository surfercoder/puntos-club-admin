import CategoryForm from '@/components/dashboard/category/category-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateCategoryPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
