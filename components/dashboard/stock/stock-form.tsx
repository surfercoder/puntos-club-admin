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
  const [selectedBranch, setSelectedBranch] = useState<string>(stock?.branch_id ?? '');
  const [selectedProduct, setSelectedProduct] = useState<string>(stock?.product_id ?? '');

  // Utils
  const [actionState, formAction, pending] = useActionState(stockFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  // Load branches and products
  useEffect(() => {
    async function loadBranches() {
      const activeOrgId =
        typeof document !== "undefined"
          ? document.cookie
              .split(";")
              .map((c) => c.trim())
              .find((c) => c.startsWith("active_org_id="))
              ?.split("=")[1]
          : undefined;

      const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;
      if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
        setBranches([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("branch")
        .select("id, name")
        .eq("organization_id", activeOrgIdNumber)
        .eq("active", true)
        .order("name");

      setBranches((data ?? []) as Branch[]);
    }

    async function loadProducts() {
      const activeOrgId =
        typeof document !== "undefined"
          ? document.cookie
              .split(";")
              .map((c) => c.trim())
              .find((c) => c.startsWith("active_org_id="))
              ?.split("=")[1]
          : undefined;

      const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;
      if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
        setProducts([]);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('product')
        .select('id, name')
        .eq("organization_id", activeOrgIdNumber)
        .eq('active', true)
        .order('name');

      setProducts((data ?? []) as Product[]);
    }

    loadBranches();
    loadProducts();

    // Listen for organization changes
    const handleOrgChange = () => {
      loadBranches();
      loadProducts();
    };

    window.addEventListener('orgChanged', handleOrgChange);
    return () => {
      window.removeEventListener('orgChanged', handleOrgChange);
    };
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/stock");
      }, 500);
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      StockSchema.parse(formData);
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
        <select
          id="branch_id"
          name="branch_id"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="branch_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.branch_id}
        >
          <option value="">Select a branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div>
        <Label htmlFor="product_id">Product</Label>
        <select
          id="product_id"
          name="product_id"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="product_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.product_id}
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
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