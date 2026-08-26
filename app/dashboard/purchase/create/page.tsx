import { getTranslations } from 'next-intl/server';

import {
  ActiveRuleCard,
  type ActiveRules,
} from '@/components/dashboard/purchase/active-rule-card';
import PurchaseForm from '@/components/dashboard/purchase/purchase-form';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

const SAMPLE_AMOUNT = 1000;

type BreakdownRow = {
  rule_id: number;
  name: string;
  is_default: boolean;
  points: number;
};

export default async function CreatePurchasePage() {
  const [t, currentUser, supabase] = await Promise.all([
    getTranslations('Dashboard.purchase'),
    getCurrentUser(),
    createClient(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let rules: ActiveRules | null = null;

  if (orgIdFilter) {
    // Las reglas suman: el desglose y el total salen de la misma función que usa
    // el motor al guardar la compra, así el panel no puede contradecir al cálculo.
    const { data } = await supabase.rpc('explain_points_for_amount', {
      p_amount: SAMPLE_AMOUNT,
      p_organization_id: orgIdFilter,
      p_branch_id: null,
      p_category_id: null,
    });

    const rows = (data ?? []) as BreakdownRow[];

    if (rows.length > 0) {
      // La vigencia no viaja en el desglose y el panel la muestra por campaña.
      const { data: periods } = await supabase
        .from('points_rule')
        .select('id, valid_from, valid_until')
        .in(
          'id',
          rows.map((row) => row.rule_id),
        );
      const periodById = new Map(
        (periods ?? []).map((row) => [row.id as number, row]),
      );

      rules = {
        sampleAmount: SAMPLE_AMOUNT,
        samplePoints: rows.reduce((total, row) => total + (row.points ?? 0), 0),
        rules: rows.map((row) => ({
          id: row.rule_id,
          name: row.name,
          isDefault: row.is_default ?? false,
          points: row.points ?? 0,
          validFrom: periodById.get(row.rule_id)?.valid_from ?? null,
          validUntil: periodById.get(row.rule_id)?.valid_until ?? null,
        })),
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('createTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('createDescription')}</p>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PurchaseForm />
        </div>
        <ActiveRuleCard rules={rules} />
      </div>
    </div>
  );
}
