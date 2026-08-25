import { getTranslations } from 'next-intl/server';

import {
  ActiveRuleCard,
  type ActiveRule,
} from '@/components/dashboard/purchase/active-rule-card';
import PurchaseForm from '@/components/dashboard/purchase/purchase-form';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

const SAMPLE_AMOUNT = 1000;

type RuleRow = {
  id: number;
  name: string;
  rule_type: string;
  is_default: boolean | null;
  config: Record<string, unknown> | null;
  valid_from: string | null;
  valid_until: string | null;
};

/** Traduce el config de la regla al par "por cada X → Y puntos" del diseño. */
function describeRule(rule: RuleRow): Pick<ActiveRule, 'perAmount' | 'points'> {
  const config = rule.config ?? {};
  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  switch (rule.rule_type) {
    case 'fixed_amount':
      return { perAmount: 100, points: num(config.points_per_dollar) };
    case 'percentage': {
      const percentage = num(config.percentage);
      return {
        perAmount: 100,
        points: percentage === null ? null : (percentage * 100) / 100,
      };
    }
    case 'fixed_per_item':
      return { perAmount: null, points: num(config.points_per_item) };
    default:
      return { perAmount: null, points: null };
  }
}

export default async function CreatePurchasePage() {
  const [t, currentUser, supabase] = await Promise.all([
    getTranslations('Dashboard.purchase'),
    getCurrentUser(),
    createClient(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let rule: ActiveRule | null = null;

  if (orgIdFilter) {
    // La campaña vigente gana sobre la regla madre: mismo orden que usa el motor.
    // La vigencia se filtra con el mismo criterio que calculate_points_for_amount,
    // para no anunciar como activa una campaña que ya venció o que todavía no arrancó.
    // ponytail: acá se compara en UTC y el motor usa la zona del club; alcanza salvo
    // que importen las últimas horas del día, ahí hay que traer el timezone de la org.
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const nowIso = now.toISOString();
    const { data } = await supabase
      .from('points_rule')
      .select('id, name, rule_type, is_default, config, valid_from, valid_until')
      .eq('organization_id', orgIdFilter)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .or(`valid_from.is.null,valid_from.lte.${nowIso}`)
      .or(`valid_until.is.null,valid_until.gte.${nowIso}`)
      .order('is_default', { ascending: true })
      .order('priority', { ascending: false })
      .limit(1);

    const row = (data ?? [])[0] as RuleRow | undefined;

    if (row) {
      const { data: samplePoints } = await supabase.rpc('calculate_points_for_amount', {
        p_amount: SAMPLE_AMOUNT,
        p_organization_id: orgIdFilter,
        p_branch_id: null,
        p_category_id: null,
      });

      rule = {
        id: row.id,
        name: row.name,
        ruleType: row.rule_type,
        isDefault: row.is_default ?? false,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        sampleAmount: SAMPLE_AMOUNT,
        samplePoints: samplePoints || 0,
        ...describeRule(row),
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
        <ActiveRuleCard rule={rule} />
      </div>
    </div>
  );
}
