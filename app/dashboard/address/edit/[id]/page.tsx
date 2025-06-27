import { createClient } from '@/lib/supabase/server';
import AddressForm from '@/components/dashboard/address/address-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('address').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching address</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Address</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm address={data} />
        </CardContent>
      </Card>
    </div>
  );
}
