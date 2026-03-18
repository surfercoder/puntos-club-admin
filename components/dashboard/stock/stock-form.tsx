"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect, useReducer } from 'react';
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

interface StockFormState {
  branches: Branch[];
  products: Product[];
  selectedBranch: string;
  selectedProduct: string;
}

type StockFormAction =
  | { type: 'SET_DATA'; branches: Branch[]; products: Product[] }
  | { type: 'SELECT_BRANCH'; value: string }
  | { type: 'SELECT_PRODUCT'; value: string };

function stockFormReducer(state: StockFormState, action: StockFormAction): StockFormState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, branches: action.branches, products: action.products };
    case 'SELECT_BRANCH':
      return { ...state, selectedBranch: action.value };
    case 'SELECT_PRODUCT':
      return { ...state, selectedProduct: action.value };
    default:
      return state;
  }
}

export default function StockForm({ stock }: StockFormProps) {
  const t = useTranslations('Dashboard.stock');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [state, dispatch] = useReducer(stockFormReducer, {
    branches: [],
    products: [],
    selectedBranch: stock?.branch_id ?? '',
    selectedProduct: stock?.product_id ?? '',
  });
  const { branches, products, selectedBranch, selectedProduct } = state;

  // Utils
  const [actionState, formAction, pending] = useActionState(stockFormAction, EMPTY_ACTION_STATE);

  // Load branches and products
  useEffect(() => {
    async function loadData() {
      const activeOrgId =
        typeof document !== "undefined"
          ? document.cookie
              .split(";")
              .map((c) => c.trim())
              .find((c) => c.startsWith("active_org_id="))
              ?.split("=")[1]
          : /* c8 ignore next */ undefined;

      const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;
      if (!activeOrgIdNumber || Number.isNaN(activeOrgIdNumber)) {
        dispatch({ type: 'SET_DATA', branches: [], products: [] });
        return;
      }

      const supabase = createClient();
      const [branchesResult, productsResult] = await Promise.all([
        supabase
          .from("branch")
          .select("id, name")
          .eq("organization_id", activeOrgIdNumber)
          .eq("active", true)
          .order("name"),
        supabase
          .from('product')
          .select('id, name')
          .eq("organization_id", activeOrgIdNumber)
          .eq('active', true)
          .order('name'),
      ]);

      dispatch({
        type: 'SET_DATA',
        branches: (branchesResult.data ?? []) as Branch[],
        products: (productsResult.data ?? []) as Product[],
      });
    }

    loadData();

    // Listen for organization changes
    window.addEventListener('orgChanged', loadData);
    return () => {
      window.removeEventListener('orgChanged', loadData);
    };
  }, []);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    redirect("/dashboard/stock");
  }

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
        <Label htmlFor="branch_id">{t('form.branchLabel')}</Label>
        <select
          id="branch_id"
          name="branch_id"
          value={selectedBranch}
          onChange={(e) => dispatch({ type: 'SELECT_BRANCH', value: e.target.value })}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="branch_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.branch_id}
        >
          <option value="">{t('form.selectBranch')}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div>
        <Label htmlFor="product_id">{t('form.productLabel')}</Label>
        <select
          id="product_id"
          name="product_id"
          value={selectedProduct}
          onChange={(e) => dispatch({ type: 'SELECT_PRODUCT', value: e.target.value })}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="product_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.product_id}
        >
          <option value="">{t('form.selectProduct')}</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="product_id" />
      </div>

      <div>
        <Label htmlFor="quantity">{t('form.quantityLabel')}</Label>
        <Input
          aria-describedby="quantity-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.quantity}
          defaultValue={stock?.quantity ?? 0}
          id="quantity"
          name="quantity"
          placeholder={t('form.quantityPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="quantity" />
      </div>

      <div>
        <Label htmlFor="minimum_quantity">{t('form.minimumQuantityLabel')}</Label>
        <Input
          aria-describedby="minimum_quantity-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.minimum_quantity}
          defaultValue={stock?.minimum_quantity ?? 0}
          id="minimum_quantity"
          name="minimum_quantity"
          placeholder={t('form.minimumQuantityPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="minimum_quantity" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/stock">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {stock ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}