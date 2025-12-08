"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { redemptionFormAction } from '@/actions/dashboard/redemption/redemption-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

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
    if (!dateString) {return '';}
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      RedemptionSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {redemption?.id && <input name="id" type="hidden" value={redemption.id} />}
      
      <div>
        <Label htmlFor="beneficiary_id">Beneficiary</Label>
        <Select defaultValue={redemption?.beneficiary_id ?? ''} name="beneficiary_id">
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
        <Select defaultValue={redemption?.product_id ?? ''} name="product_id">
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
        <Select defaultValue={redemption?.order_id ?? ''} name="order_id">
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
          aria-describedby="points_used-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.points_used}
          defaultValue={redemption?.points_used ?? 0}
          id="points_used"
          min="0"
          name="points_used"
          placeholder="Enter points used"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="points_used" />
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          aria-describedby="quantity-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.quantity}
          defaultValue={redemption?.quantity ?? 0}
          id="quantity"
          min="0"
          name="quantity"
          placeholder="Enter quantity"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="quantity" />
      </div>

      <div>
        <Label htmlFor="redemption_date">Redemption Date</Label>
        <Input
          aria-describedby="redemption_date-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.redemption_date}
          defaultValue={redemption?.redemption_date ? formatDateForInput(redemption.redemption_date) : ''}
          id="redemption_date"
          name="redemption_date"
          type="date"
        />
        <FieldError actionState={validation ?? actionState} name="redemption_date" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/redemption">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {redemption ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}