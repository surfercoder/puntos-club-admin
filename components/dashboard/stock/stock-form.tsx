"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { stockFormAction } from '@/actions/dashboard/stock/stock-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { StockSchema } from '@/schemas/stock.schema';
import type { Stock } from '@/types/stock';

interface StockFormProps {
  stock?: Stock;
}

interface Branch {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

export default function StockForm({ stock }: StockFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(stock?.branch_id || '');
  const [selectedProduct, setSelectedProduct] = useState<string>(stock?.product_id || '');

  // Utils
  const [actionState, formAction, pending] = useActionState(stockFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load branches and products
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      const [branchesResult, productsResult] = await Promise.all([
        supabase.from('branch').select('id, name').eq('active', true).order('name'),
        supabase.from('product').select('id, name').eq('active', true).order('name')
      ]);

      if (branchesResult.data) {
        setBranches(branchesResult.data);
      }
      if (productsResult.data) {
        setProducts(productsResult.data);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/stock");
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
    const formData = new FormData(event.currentTarget);
    setValidation(null);

    // Add selected values to form data
    if (selectedBranch) {
      formData.set('branch_id', selectedBranch);
    }
    if (selectedProduct) {
      formData.set('product_id', selectedProduct);
    }

    // Transform form data to match schema expectations
    const transformedData = {
      branch_id: formData.get('branch_id') as string,
      product_id: formData.get('product_id') as string,
      quantity: parseInt(formData.get('quantity') as string) || 0,
      minimum_quantity: parseInt(formData.get('minimum_quantity') as string) || 0,
      last_updated: formData.get('last_updated') as string,
    };

    try {
      StockSchema.parse(transformedData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {stock?.id && <input name="id" type="hidden" value={stock.id} />}
      
      <div>
        <Label htmlFor="branch_id">Branch</Label>
        <Select name="branch_id" onValueChange={setSelectedBranch} value={selectedBranch}>
          <SelectTrigger>
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div>
        <Label htmlFor="product_id">Product</Label>
        <Select name="product_id" onValueChange={setSelectedProduct} value={selectedProduct}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
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
        <Label htmlFor="quantity">Current Quantity</Label>
        <Input
          defaultValue={stock?.quantity ?? 0}
          id="quantity"
          min="0"
          name="quantity"
          placeholder="Enter current quantity"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="quantity" />
      </div>

      <div>
        <Label htmlFor="minimum_quantity">Minimum Quantity</Label>
        <Input
          defaultValue={stock?.minimum_quantity ?? 0}
          id="minimum_quantity"
          min="0"
          name="minimum_quantity"
          placeholder="Enter minimum quantity threshold"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="minimum_quantity" />
      </div>

      <div>
        <Label htmlFor="last_updated">Last Updated</Label>
        <Input
          defaultValue={stock?.last_updated ? formatDateForInput(stock.last_updated) : ''}
          id="last_updated"
          name="last_updated"
          type="date"
        />
        <FieldError actionState={validation ?? actionState} name="last_updated" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/stock">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {stock ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}