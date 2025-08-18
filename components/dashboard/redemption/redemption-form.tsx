"use client";

import { useActionState, useState, useEffect } from 'react';
import { redemptionFormAction } from '@/actions/dashboard/redemption/redemption-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Redemption } from '@/types/redemption';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface RedemptionFormProps {
  redemption?: Redemption;
}

interface Beneficiary {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface Product {
  id: string;
  name: string;
}

interface AppOrder {
  id: string;
  order_number: string;
}

export default function RedemptionForm({ redemption }: RedemptionFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>(redemption?.beneficiary_id || '');
  const [selectedProduct, setSelectedProduct] = useState<string>(redemption?.product_id || '');
  const [selectedOrder, setSelectedOrder] = useState<string>(redemption?.order_id || '');

  // Utils
  const [actionState, formAction, pending] = useActionState(redemptionFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load beneficiaries, products, and orders
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      const [beneficiariesResult, productsResult, ordersResult] = await Promise.all([
        supabase.from('beneficiary').select('id, first_name, last_name, email').order('first_name'),
        supabase.from('product').select('id, name').eq('active', true).order('name'),
        supabase.from('app_order').select('id, order_number').order('order_number')
      ]);

      if (beneficiariesResult.data) {
        setBeneficiaries(beneficiariesResult.data);
      }
      if (productsResult.data) {
        setProducts(productsResult.data);
      }
      if (ordersResult.data) {
        setOrders(ordersResult.data);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/redemption");
      }, 500);
    }
  }, [actionState, router]);

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected values to form data
    if (selectedBeneficiary) {
      formData.set('beneficiary_id', selectedBeneficiary);
    }
    if (selectedProduct) {
      formData.set('product_id', selectedProduct);
    }
    if (selectedOrder) {
      formData.set('order_id', selectedOrder);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      beneficiary_id: formData.get('beneficiary_id') as string,
      product_id: formData.get('product_id') as string || null,
      order_id: formData.get('order_id') as string,
      points_used: parseInt(formData.get('points_used') as string) || 0,
      quantity: parseInt(formData.get('quantity') as string) || 0,
      redemption_date: formData.get('redemption_date') as string,
    };

    try {
      RedemptionSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {redemption?.id && <input type="hidden" name="id" value={redemption.id} />}
      
      <div>
        <Label htmlFor="beneficiary_id">Beneficiary</Label>
        <Select value={selectedBeneficiary} onValueChange={setSelectedBeneficiary} name="beneficiary_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a beneficiary" />
          </SelectTrigger>
          <SelectContent>
            {beneficiaries.map((beneficiary) => (
              <SelectItem key={beneficiary.id} value={beneficiary.id}>
                {beneficiary.first_name || beneficiary.last_name 
                  ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
                  : beneficiary.email || 'Unnamed Beneficiary'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="product_id">Product (Optional)</Label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct} name="product_id">
          <SelectTrigger>
            <SelectValue placeholder="Select a product (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="product_id" />
      </div>

      <div>
        <Label htmlFor="order_id">Order</Label>
        <Select value={selectedOrder} onValueChange={setSelectedOrder} name="order_id">
          <SelectTrigger>
            <SelectValue placeholder="Select an order" />
          </SelectTrigger>
          <SelectContent>
            {orders.map((order) => (
              <SelectItem key={order.id} value={order.id}>
                {order.order_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="order_id" />
      </div>

      <div>
        <Label htmlFor="points_used">Points Used</Label>
        <Input
          id="points_used"
          name="points_used"
          type="number"
          min="0"
          defaultValue={redemption?.points_used ?? 0}
          placeholder="Enter points used"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.points_used}
          aria-describedby="points_used-error"
        />
        <FieldError actionState={validation ?? actionState} name="points_used" />
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          defaultValue={redemption?.quantity ?? 0}
          placeholder="Enter quantity"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.quantity}
          aria-describedby="quantity-error"
        />
        <FieldError actionState={validation ?? actionState} name="quantity" />
      </div>

      <div>
        <Label htmlFor="redemption_date">Redemption Date</Label>
        <Input
          id="redemption_date"
          name="redemption_date"
          type="date"
          defaultValue={redemption?.redemption_date ? formatDateForInput(redemption.redemption_date) : ''}
          aria-invalid={!!(validation ?? actionState).fieldErrors?.redemption_date}
          aria-describedby="redemption_date-error"
        />
        <FieldError actionState={validation ?? actionState} name="redemption_date" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/redemption">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {redemption ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}