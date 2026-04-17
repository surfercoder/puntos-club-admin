"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useActionState, useEffect, useReducer } from 'react';
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
  required_points: number;
}

interface BeneficiaryWithPoints extends Beneficiary {
  available_points: number;
}

interface FormState {
  beneficiaries: BeneficiaryWithPoints[];
  products: Product[];
  validation: ActionState | null;
  selectedProductId: string;
  selectedBeneficiaryId: string;
  pointsUsed: number;
  orgId: string | null;
}

type FormAction =
  | { type: 'SET_FORM_DATA'; payload: { beneficiaries: BeneficiaryWithPoints[]; products: Product[] } }
  | { type: 'SET_VALIDATION'; payload: ActionState | null }
  | { type: 'SET_SELECTED_PRODUCT'; payload: { productId: string; requiredPoints: number | null } }
  | { type: 'SET_SELECTED_BENEFICIARY'; payload: string }
  | { type: 'SET_POINTS_USED'; payload: number }
  | { type: 'SET_ORG_ID'; payload: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, beneficiaries: action.payload.beneficiaries, products: action.payload.products };
    case 'SET_VALIDATION':
      return { ...state, validation: action.payload };
    case 'SET_SELECTED_PRODUCT':
      return {
        ...state,
        selectedProductId: action.payload.productId,
        ...(action.payload.requiredPoints !== null ? { pointsUsed: action.payload.requiredPoints } : {}),
      };
    case 'SET_SELECTED_BENEFICIARY':
      return { ...state, selectedBeneficiaryId: action.payload };
    case 'SET_POINTS_USED':
      return { ...state, pointsUsed: action.payload };
    case 'SET_ORG_ID':
      return { ...state, orgId: action.payload };
    /* c8 ignore next 2 */
    default:
      return state;
  }
}

export default function RedemptionForm({ redemption }: RedemptionFormProps) {
  const t = useTranslations('Dashboard.redemption');
  const tCommon = useTranslations('Common');

  // State
  const [state, dispatch] = useReducer(formReducer, {
    beneficiaries: [],
    products: [],
    validation: null,
    selectedProductId: redemption?.product_id ? String(redemption.product_id) : '',
    selectedBeneficiaryId: redemption?.beneficiary_id ? String(redemption.beneficiary_id) : '',
    pointsUsed: redemption?.points_used ?? 0,
    orgId: null,
  });

  const { beneficiaries, products, validation, selectedProductId, selectedBeneficiaryId, pointsUsed, orgId } = state;

  // Derived state
  const selectedProduct = products.find(p => String(p.id) === selectedProductId);
  const selectedBeneficiary = beneficiaries.find(b => String(b.id) === selectedBeneficiaryId);
  const hasProduct = selectedProductId !== '' && !!selectedProduct;
  const insufficientPoints = !!selectedBeneficiary && pointsUsed > selectedBeneficiary.available_points;

  // Utils
  const [actionState, formAction, pending] = useActionState(redemptionFormAction, EMPTY_ACTION_STATE);

  useEffect(() => {
    try {
      const activeOrgId = document.cookie
        .split('; ')
        .find(row => row.startsWith('active_org_id='))
        ?.split('=')[1];
      if (activeOrgId) {
        dispatch({ type: 'SET_ORG_ID', payload: activeOrgId });
      }
    } /* c8 ignore next 2 */ catch {
      // ignore
    }
  }, []);

  // Load beneficiaries and products (only when orgId is available)
  useEffect(() => {
    if (!orgId) return;

    async function loadData() {
      const supabase = createClient();

      const orgIdNumber = Number(orgId);
      if (Number.isNaN(orgIdNumber)) return;

      // Beneficiaries filtered by organization, including available_points
      const beneficiariesPromise = supabase
        .from('beneficiary_organization')
        .select('available_points, beneficiary:beneficiary_id(id, first_name, last_name, email)')
        .eq('organization_id', orgIdNumber)
        .eq('is_active', true);

      // Products filtered by organization, including required_points
      const productsPromise = supabase
        .from('product')
        .select('id, name, required_points')
        .eq('active', true)
        .eq('organization_id', orgIdNumber)
        .order('name');

      const [beneficiariesResult, productsResult] = await Promise.all([
        beneficiariesPromise,
        productsPromise,
      ]);

      let loadedBeneficiaries: BeneficiaryWithPoints[] = [];
      if (beneficiariesResult.data) {
        const nested = beneficiariesResult.data as unknown as { beneficiary: Beneficiary; available_points: number }[];
        loadedBeneficiaries = nested.flatMap(r =>
          r.beneficiary ? [{ ...r.beneficiary, available_points: r.available_points ?? 0 }] : []
        );
      }

      dispatch({
        type: 'SET_FORM_DATA',
        payload: {
          beneficiaries: loadedBeneficiaries,
          products: productsResult.data ? (productsResult.data as unknown as Product[]) : [],
        },
      });
    }
    loadData();
  }, [orgId]);

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
  const handleProductChange = (productId: string) => {
    const product = products.find(p => String(p.id) === productId);
    dispatch({
      type: 'SET_SELECTED_PRODUCT',
      payload: { productId, requiredPoints: product ? product.required_points : null },
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    dispatch({ type: 'SET_VALIDATION', payload: null });

    try {
      RedemptionSchema.parse(formData);
    } catch (error) {
      dispatch({ type: 'SET_VALIDATION', payload: fromErrorToActionState(error) });
      event.preventDefault();
      return;
    }

    // Check if beneficiary has enough points
    if (selectedBeneficiary) {
      const totalPoints = pointsUsed;
      if (totalPoints > selectedBeneficiary.available_points) {
        dispatch({
          type: 'SET_VALIDATION',
          payload: {
            status: 'error',
            message: t('form.insufficientPoints', { available: selectedBeneficiary.available_points, required: totalPoints }),
            fieldErrors: { points_used: [t('form.insufficientPointsField')] },
          },
        });
        event.preventDefault();
        return;
      }
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {redemption?.id && <input name="id" type="hidden" value={redemption.id} />}
      {orgId && <input name="organization_id" type="hidden" value={orgId} />}

      <div>
        <Label htmlFor="beneficiary_id">{t('form.beneficiaryLabel')}</Label>
        <Select
          defaultValue={redemption?.beneficiary_id ? String(redemption.beneficiary_id) : ''}
          name="beneficiary_id"
          onValueChange={(value) => dispatch({ type: 'SET_SELECTED_BENEFICIARY', payload: value })}
        >
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
        {selectedBeneficiary && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('form.availablePoints')}: {selectedBeneficiary.available_points}
          </p>
        )}
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="product_id">{t('form.productLabel')}</Label>
        <Select
          defaultValue={redemption?.product_id ? String(redemption.product_id) : ''}
          name="product_id"
          onValueChange={handleProductChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('form.selectProduct')} />
          </SelectTrigger>
          <SelectContent>
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
        <Label htmlFor="points_used">{t('form.points')}</Label>
        <Input
          aria-describedby="points_used-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.points_used}
          id="points_used"
          name="points_used"
          onChange={hasProduct ? undefined : (e) => dispatch({ type: 'SET_POINTS_USED', payload: Number(e.target.value) || 0 })}
          readOnly={hasProduct}
          type="number"
          value={pointsUsed}
        />
        {insufficientPoints && (
          <p className="text-sm text-destructive mt-1">{t('form.insufficientPointsField')}</p>
        )}
        <FieldError actionState={validation ?? actionState} name="points_used" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/redemption">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending || insufficientPoints} type="submit">
          {redemption ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
