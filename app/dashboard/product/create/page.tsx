import ProductForm from '@/components/dashboard/product/product-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateProductPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}