"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect, useReducer } from 'react';
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

interface FormDataState {
  beneficiaries: Beneficiary[];
  products: Product[];
  orders: AppOrder[];
}

type FormDataAction = {
  type: 'SET_FORM_DATA';
  payload: FormDataState;
};

function formDataReducer(_state: FormDataState, action: FormDataAction): FormDataState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return action.payload;
    /* c8 ignore next 2 */
    default:
      return _state;
  }
}

const initialFormDataState: FormDataState = {
  beneficiaries: [],
  products: [],
  orders: [],
};

export default function RedemptionForm({ redemption }: RedemptionFormProps) {
  const t = useTranslations('Dashboard.redemption');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [formData, dispatchFormData] = useReducer(formDataReducer, initialFormDataState);
  const { beneficiaries, products, orders } = formData;

  // Utils
  const [actionState, formAction, pending] = useActionState(redemptionFormAction, EMPTY_ACTION_STATE);

  // Load beneficiaries, products, and orders
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Get active organization ID
      let orgIdNumber: number | null = null;
      try {
        const activeOrgId = document.cookie
          .split('; ')
          .find(row => row.startsWith('active_org_id='))
          ?.split('=')[1];
        if (activeOrgId) {
          const parsed = Number(activeOrgId);
          if (!Number.isNaN(parsed)) {
            orgIdNumber = parsed;
          }
        }
      } /* c8 ignore next 2 */ catch {
        // ignore
      }

      // Build beneficiaries query filtered by organization
      let beneficiariesPromise;
      if (orgIdNumber) {
        beneficiariesPromise = supabase
          .from('beneficiary_organization')
          .select('beneficiary:beneficiary_id(id, first_name, last_name, email)')
          .eq('organization_id', orgIdNumber)
          .eq('is_active', true);
      } else {
        beneficiariesPromise = supabase
          .from('beneficiary')
          .select('id, first_name, last_name, email')
          .order('first_name');
      }

      // Build products query filtered by organization
      let productsQuery = supabase.from('product').select('id, name').eq('active', true).order('name');
      if (orgIdNumber) {
        productsQuery = productsQuery.eq('organization_id', orgIdNumber);
      }

      const [beneficiariesResult, productsResult, ordersResult] = await Promise.all([
        beneficiariesPromise,
        productsQuery,
        supabase.from('app_order').select('id, order_number').order('order_number')
      ]);

      let loadedBeneficiaries: Beneficiary[] = [];
      if (beneficiariesResult.data) {
        if (orgIdNumber) {
          // Extract nested beneficiary objects from join
          const nested = beneficiariesResult.data as unknown as { beneficiary: Beneficiary }[];
          loadedBeneficiaries = nested.map(r => r.beneficiary).filter(Boolean);
        } else {
          loadedBeneficiaries = beneficiariesResult.data as unknown as Beneficiary[];
        }
      }

      dispatchFormData({
        type: 'SET_FORM_DATA',
        payload: {
          beneficiaries: loadedBeneficiaries,
          products: productsResult.data ? (productsResult.data as unknown as Product[]) : [],
          orders: ordersResult.data ? (ordersResult.data as unknown as AppOrder[]) : [],
        },
      });
    }
    loadData();
  }, []);

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    redirect("/dashboard/redemption");
  }

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
        <Label htmlFor="beneficiary_id">{t('form.beneficiaryLabel')}</Label>
        <Select defaultValue={redemption?.beneficiary_id ? String(redemption.beneficiary_id) : ''} name="beneficiary_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectBeneficiary')} />
          </SelectTrigger>
          <SelectContent>
            {beneficiaries.map((beneficiary) => (
              <SelectItem key={beneficiary.id} value={String(beneficiary.id)}>
                {beneficiary.first_name || beneficiary.last_name
                  ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
                  : beneficiary.email || t('form.noName')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="product_id">{t('form.productLabel')}</Label>
        <Select defaultValue={redemption?.product_id ? String(redemption.product_id) : 'none'} name="product_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectProduct')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('form.none')}</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={String(product.id)}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="product_id" />
      </div>

      <div>
        <Label htmlFor="order_id">{t('form.orderLabel')}</Label>
        <Select defaultValue={redemption?.order_id ? String(redemption.order_id) : ''} name="order_id">
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectOrder')} />
          </SelectTrigger>
          <SelectContent>
            {orders.map((order) => (
              <SelectItem key={order.id} value={String(order.id)}>
                {order.order_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="order_id" />
      </div>

      <div>
        <Label htmlFor="points_used">{t('form.pointsUsed')}</Label>
        <Input
          aria-describedby="points_used-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.points_used}
          defaultValue={redemption?.points_used ?? 0}
          id="points_used"
          name="points_used"
          placeholder={t('form.pointsUsedPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="points_used" />
      </div>

      <div>
        <Label htmlFor="quantity">{t('form.quantityLabel')}</Label>
        <Input
          aria-describedby="quantity-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.quantity}
          defaultValue={redemption?.quantity ?? 0}
          id="quantity"
          name="quantity"
          placeholder={t('form.quantityPlaceholder')}
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="quantity" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/redemption">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {redemption ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
