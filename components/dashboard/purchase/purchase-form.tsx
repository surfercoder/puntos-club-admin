"use client";

import { FileText, Send, User } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useActionState, useCallback, useEffect, useReducer, useState } from 'react';

import { purchaseFormAction } from '@/actions/dashboard/purchase/purchase-form-actions';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';
import { PurchaseSchema } from '@/schemas/purchase.schema';
import type { Purchase } from '@/types/purchase';

const NUMBER_FORMATTER = new Intl.NumberFormat('es-AR');
const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

const REASONS = ['welcome', 'campaign', 'compensation', 'referral', 'other'] as const;

/** Espera antes de preguntarle los puntos al motor mientras se tipea el importe. */
const POINTS_DEBOUNCE_MS = 300;

type PurchaseMode = 'assignment' | 'sale';
type Person = { id: string; first_name: string; last_name: string };
type NamedEntity = { id: string; name: string };
type Activity = {
  id: string;
  purchase_date: string;
  total_amount: number;
  points_earned: number;
};

interface PurchaseFormProps {
  purchase?: Purchase;
}

interface FormDataState {
  beneficiaries: Person[];
  branches: NamedEntity[];
}

const initialFormData: FormDataState = { beneficiaries: [], branches: [] };

function formDataReducer(state: FormDataState, action: Partial<FormDataState>): FormDataState {
  return { ...state, ...action };
}

function getOrgIdFromCookies(): number | null {
  try {
    const activeOrgId = document.cookie
      .split('; ')
      .find(row => row.startsWith('active_org_id='))
      ?.split('=')[1];
    if (activeOrgId) {
      const parsed = Number(activeOrgId);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Paso 1 del diseño: elegir entre asignar puntos sueltos o registrar una venta. */
function ModeSelector({
  mode,
  onSelect,
}: {
  mode: PurchaseMode;
  onSelect: (mode: PurchaseMode) => void;
}) {
  const t = useTranslations('Dashboard.purchase.form');

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(['assignment', 'sale'] as const).map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              mode === option
                ? 'border-brand-violet bg-brand-violet/5'
                : 'hover:bg-accent'
            }`}
          >
            <input
              type="radio"
              name="mode-choice"
              className="mt-0.5 size-4 accent-[var(--brand-violet)]"
              checked={mode === option}
              onChange={() => onSelect(option)}
            />
            <span>
              <span
                className={`block text-sm font-semibold ${
                  mode === option ? 'text-brand-violet' : ''
                }`}
              >
                {t(`modes.${option}.title`)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t(`modes.${option}.description`)}
              </span>
            </span>
          </label>
        ))}
      </div>

      <p className="mt-4 rounded-lg bg-brand-violet/5 px-4 py-3 text-xs text-muted-foreground">
        {mode === 'sale' ? t('saleHint') : t('assignmentHint')}
      </p>
    </>
  );
}

/** Beneficiario y sucursal: el "quién" y el "dónde" de la operación. */
function PartiesFields({
  beneficiaries,
  beneficiaryId,
  onBeneficiaryChange,
  branches,
  branchId,
  onBranchChange,
  errorState,
}: {
  beneficiaries: Person[];
  beneficiaryId: string;
  onBeneficiaryChange: (value: string) => void;
  branches: NamedEntity[];
  branchId: string;
  onBranchChange: (value: string) => void;
  errorState: ActionState;
}) {
  const t = useTranslations('Dashboard.purchase.form');

  return (
    <>
      <div>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="beneficiary_id">
              {t('beneficiaryLabel')} <span className="text-destructive">*</span>
            </Label>
            <div className="mt-1.5">
              <Combobox
                defaultValue={beneficiaryId}
                name="beneficiary_id"
                onValueChange={onBeneficiaryChange}
                options={beneficiaries.map(b => ({
                  value: String(b.id),
                  label: `${b.first_name} ${b.last_name}`,
                }))}
                placeholder={t('selectBeneficiary')}
              />
            </div>
          </div>
          <Button asChild type="button" variant="outline" className="h-9">
            <Link
              href={
                beneficiaryId
                  ? `/dashboard/beneficiary/edit/${beneficiaryId}`
                  : '/dashboard/beneficiary'
              }
            >
              <User className="size-4" />
              {t('viewProfile')}
            </Link>
          </Button>
        </div>
        <FieldError actionState={errorState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="branch_id">{t('branchLabel')}</Label>
        <Select
          defaultValue={branchId}
          name="branch_id"
          onValueChange={onBranchChange}
        >
          <SelectTrigger className="mt-1.5 w-full" id="branch_id">
            <SelectValue placeholder={t('selectBranch')} />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={errorState} name="branch_id" />
      </div>
    </>
  );
}

/** Importe (venta) o puntos a asignar, junto al saldo disponible del beneficiario. */
function AmountFields({
  mode,
  amount,
  onAmountChange,
  points,
  onPointsChange,
  balance,
  errorState,
}: {
  mode: PurchaseMode;
  amount: string;
  onAmountChange: (value: string) => void;
  points: string;
  onPointsChange: (value: string) => void;
  balance: number | null;
  errorState: ActionState;
}) {
  const t = useTranslations('Dashboard.purchase.form');

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={mode === 'sale' ? 'total_amount' : 'points_earned'}>
          {mode === 'sale' ? t('totalAmountLabel') : t('pointsToAssignLabel')}{' '}
          <span className="text-destructive">*</span>
        </Label>
        {mode === 'sale' ? (
          <Input
            className="mt-1.5"
            id="total_amount"
            name="total_amount"
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
        ) : (
          <div className="mt-1.5 flex">
            <Input
              className="rounded-r-none"
              id="points_earned"
              name="points_earned"
              placeholder="0"
              type="number"
              step="1"
              min="0"
              value={points}
              onChange={(e) => onPointsChange(e.target.value)}
            />
            <span className="grid place-items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
              pts
            </span>
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {mode === 'sale' ? t('totalAmountHelp') : t('pointsToAssignHelp')}
        </p>
        <FieldError actionState={errorState} name="total_amount" />
        <FieldError actionState={errorState} name="points_earned" />
      </div>

      <div>
        <Label htmlFor="available_points">{t('availablePointsLabel')}</Label>
        <Input
          className="mt-1.5 font-semibold text-brand-violet"
          id="available_points"
          readOnly
          value={balance === null ? '—' : `${NUMBER_FORMATTER.format(balance)} pts`}
        />
      </div>
    </div>
  );
}

/** Resumen previo a confirmar: a quién, cuántos puntos y con qué saldo queda. */
function OperationSummary({
  beneficiaryName,
  pointsToAward,
  balance,
}: {
  beneficiaryName: string | null;
  pointsToAward: number;
  balance: number | null;
}) {
  const t = useTranslations('Dashboard.purchase.form');

  return (
    <div className="flex items-start gap-3 rounded-xl bg-brand-blue/5 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t('summaryTitle')}</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">{t('summaryBeneficiary')}</dt>
            <dd className="text-sm font-medium">{beneficiaryName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('summaryPoints')}</dt>
            <dd className="text-sm font-bold text-brand-blue">
              {NUMBER_FORMATTER.format(pointsToAward)} pts
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('summaryTotal')}</dt>
            <dd className="text-sm font-medium">
              {balance === null
                ? '—'
                : `${NUMBER_FORMATTER.format(balance + pointsToAward)} pts`}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Últimos movimientos del beneficiario elegido. */
function ActivityTable({ activity }: { activity: Activity[] }) {
  const t = useTranslations('Dashboard.purchase.form');

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">{t('activityTitle')}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 font-medium">{t('activityDate')}</th>
              <th className="pb-2 font-medium">{t('activityType')}</th>
              <th className="pb-2 font-medium">{t('activityDescription')}</th>
              <th className="pb-2 text-right font-medium">{t('activityPoints')}</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2.5">
                  <span suppressHydrationWarning>{formatDateTime(item.purchase_date)}</span>
                </td>
                <td className="py-2.5">
                  <span className="inline-block rounded-md bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green">
                    {Number(item.total_amount) > 0
                      ? t('modes.sale.title')
                      : t('modes.assignment.title')}
                  </span>
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {Number(item.total_amount) > 0
                    ? t('activitySale', {
                        amount: CURRENCY_FORMATTER.format(Number(item.total_amount)),
                      })
                    : t('activityAssignment')}
                </td>
                <td className="py-2.5 text-right font-semibold text-brand-green">
                  +{NUMBER_FORMATTER.format(item.points_earned)} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PurchaseForm({ purchase }: PurchaseFormProps) {
  const t = useTranslations('Dashboard.purchase.form');
  const tCommon = useTranslations('Common');

  const [validation, setValidation] = useState<ActionState | null>(null);
  const [mode, setMode] = useState<PurchaseMode>(
    purchase && Number(purchase.total_amount) > 0 ? 'sale' : 'assignment',
  );
  const [beneficiaryId, setBeneficiaryId] = useState(
    purchase?.beneficiary_id ? String(purchase.beneficiary_id) : '',
  );
  const [branchId, setBranchId] = useState(
    purchase?.branch_id ? String(purchase.branch_id) : '',
  );
  const [amount, setAmount] = useState<string>(
    purchase && Number(purchase.total_amount) > 0 ? String(purchase.total_amount) : '',
  );
  const [points, setPoints] = useState<string>(
    purchase?.points_earned ? String(purchase.points_earned) : '',
  );
  const [computedPoints, setComputedPoints] = useState<number | null>(
    purchase?.points_earned ?? null,
  );
  const [reason, setReason] = useState('');
  const [observations, setObservations] = useState(purchase?.notes ?? '');
  const [balance, setBalance] = useState<number | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [{ beneficiaries, branches }, dispatchFormData] = useReducer(
    formDataReducer,
    initialFormData,
  );

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const orgIdNumber = getOrgIdFromCookies();

      const beneficiariesPromise = orgIdNumber
        ? supabase
            .from('beneficiary_organization')
            .select('beneficiary:beneficiary_id(id, first_name, last_name)')
            .eq('organization_id', orgIdNumber)
            .eq('is_active', true)
        : supabase.from('beneficiary').select('id, first_name, last_name').order('first_name');

      let branchesQuery = supabase.from('branch').select('id, name').order('name');
      if (orgIdNumber) {
        branchesQuery = branchesQuery.eq('organization_id', orgIdNumber);
      }

      const [bRes, brRes] = await Promise.all([beneficiariesPromise, branchesQuery]);

      let loadedBeneficiaries: Person[] = [];
      if (bRes.data) {
        if (orgIdNumber) {
          const nested = bRes.data as unknown as { beneficiary: Person }[];
          loadedBeneficiaries = nested.flatMap(r => r.beneficiary ? [r.beneficiary] : []);
        } else {
          loadedBeneficiaries = bRes.data as unknown as Person[];
        }
      }

      dispatchFormData({ beneficiaries: loadedBeneficiaries, branches: brRes.data ?? [] });
    }
    loadData();
  }, []);

  // Saldo y últimos movimientos del beneficiario elegido: el diseño los muestra
  // antes de confirmar para que el owner vea el impacto de la operación.
  useEffect(() => {
    if (!beneficiaryId) {
      setBalance(null);
      setActivity([]);
      return;
    }
    let cancelled = false;

    async function loadBeneficiary() {
      const supabase = createClient();
      const orgIdNumber = getOrgIdFromCookies();

      let balanceQuery = supabase
        .from('beneficiary_organization')
        .select('available_points')
        .eq('beneficiary_id', beneficiaryId);
      if (orgIdNumber) {
        balanceQuery = balanceQuery.eq('organization_id', orgIdNumber);
      }

      let activityQuery = supabase
        .from('purchase')
        .select('id, purchase_date, total_amount, points_earned')
        .eq('beneficiary_id', beneficiaryId)
        .order('purchase_date', { ascending: false })
        .limit(5);
      if (orgIdNumber) {
        activityQuery = activityQuery.eq('organization_id', orgIdNumber);
      }

      const [balanceRes, activityRes] = await Promise.all([balanceQuery, activityQuery]);
      if (cancelled) return;

      setBalance(balanceRes.data?.[0]?.available_points ?? 0);
      setActivity((activityRes.data ?? []) as unknown as Activity[]);
    }

    loadBeneficiary();
    return () => { cancelled = true; };
  }, [beneficiaryId]);

  const calculatePoints = useCallback(async (saleAmount: number, branch: string) => {
    if (saleAmount <= 0) return 0;
    const supabase = createClient();
    const { data } = await supabase.rpc('calculate_points_for_amount', {
      p_amount: saleAmount,
      p_organization_id: getOrgIdFromCookies(),
      p_branch_id: branch ? parseInt(branch, 10) : null,
      p_category_id: null,
    });
    return Number(data) || 0;
  }, []);

  // Sin la espera, cada tecla del importe sería una consulta al motor de puntos:
  // preguntamos una sola vez cuando el tipeo se aquieta y descartamos la respuesta
  // de un importe viejo, que si llega tarde pisaría el preview del importe actual.
  useEffect(() => {
    if (mode !== 'sale') return;
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      setComputedPoints(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const awarded = await calculatePoints(parsedAmount, branchId);
      if (cancelled) return;
      setComputedPoints(awarded);
    }, POINTS_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, amount, branchId, calculatePoints]);

  const [actionState, formAction, pending] = useActionState(purchaseFormAction, EMPTY_ACTION_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);
    try {
      PurchaseSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  const pointsToAward =
    mode === 'assignment' ? Number(points) || 0 : computedPoints ?? 0;
  const beneficiary = beneficiaries.find(b => String(b.id) === beneficiaryId);
  const beneficiaryName = beneficiary
    ? `${beneficiary.first_name} ${beneficiary.last_name}`.trim()
    : null;
  const errorState = validation ?? actionState;
  // `purchase` no tiene columna de motivo: lo guardamos junto a la observación
  // en `notes`, que es el campo libre que ya existe.
  const composedNotes = [reason ? t(`reasons.${reason}`) : null, observations]
    .filter(Boolean)
    .join(' — ');

  return (
    <form action={formAction} className="space-y-5" onSubmit={handleSubmit}>
      {purchase?.id && <input name="id" type="hidden" value={purchase.id} />}
      <input name="mode" type="hidden" value={mode} />

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t('step1')}</h2>

        <ModeSelector mode={mode} onSelect={setMode} />

        <div className="mt-5 space-y-4">
          <PartiesFields
            beneficiaries={beneficiaries}
            beneficiaryId={beneficiaryId}
            branchId={branchId}
            branches={branches}
            errorState={errorState}
            onBeneficiaryChange={setBeneficiaryId}
            onBranchChange={setBranchId}
          />

          <AmountFields
            amount={amount}
            balance={balance}
            errorState={errorState}
            mode={mode}
            onAmountChange={setAmount}
            onPointsChange={setPoints}
            points={points}
          />

          <div>
            <Label htmlFor="reason">{t('reasonLabel')}</Label>
            <Select name="reason" value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5 w-full" id="reason">
                <SelectValue placeholder={t('selectReason')} />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {t(`reasons.${reason}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">{t('reasonHelp')}</p>
          </div>

          <div>
            <Label htmlFor="notes">{t('notesLabel')}</Label>
            <Textarea
              className="mt-1.5"
              id="notes"
              onChange={(e) => setObservations(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={2}
              value={observations}
            />
            <input name="notes" type="hidden" value={composedNotes} />
            <p className="mt-1.5 text-xs text-muted-foreground">{t('notesHelp')}</p>
          </div>

          <OperationSummary
            balance={balance}
            beneficiaryName={beneficiaryName}
            pointsToAward={pointsToAward}
          />

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="secondary">
              <Link href="/dashboard/purchase">{tCommon('cancel')}</Link>
            </Button>
            <Button disabled={pending} type="submit">
              <Send className="size-4" />
              {mode === 'sale' ? t('submitSale') : t('submitAssignment')}
            </Button>
          </div>
        </div>
      </section>

      {activity.length > 0 && <ActivityTable activity={activity} />}
    </form>
  );
}
