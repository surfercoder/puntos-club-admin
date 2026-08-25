import { ArrowLeft, CircleDot } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { MotherRuleForm } from '@/components/dashboard/points-rules/mother-rule-form';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { MOTHER_RULE_TYPES, formatDateTime, type MotherRuleType } from '@/lib/utils';

type RuleRow = {
  id: number;
  name: string;
  rule_type: string;
  config: Record<string, unknown> | null;
  branch_id: number | null;
  is_active: boolean;
  updated_at: string | null;
};

/** El valor editable depende del tipo: porcentaje, puntos por $100 o por ítem. */
function readValue(rule: RuleRow): string {
  const config = rule.config ?? {};
  const raw =
    rule.rule_type === 'percentage'
      ? config.percentage
      : rule.rule_type === 'fixed_per_item'
        ? config.points_per_item
        : config.points_per_dollar;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? String(parsed) : '0';
}

export default async function MotherRulePage() {
  const [t, currentUser, supabase] = await Promise.all([
    getTranslations('PointsRules.motherForm'),
    getCurrentUser(),
    createClient(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  if (!orgIdFilter) {
    return <p className="text-sm text-muted-foreground">{t('noOrganization')}</p>;
  }

  const [{ data: ruleRows }, { data: branchRows }] = await Promise.all([
    supabase
      .from('points_rule')
      .select('id, name, rule_type, config, branch_id, is_active, updated_at')
      .eq('organization_id', orgIdFilter)
      .eq('is_default', true)
      .limit(1),
    supabase
      .from('branch')
      .select('id, name')
      .eq('organization_id', orgIdFilter)
      .eq('active', true)
      .order('name'),
  ]);

  const rule = (ruleRows ?? [])[0] as RuleRow | undefined;

  if (!rule) {
    return (
      <div className="space-y-4">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          href="/dashboard/points-rules"
        >
          <ArrowLeft className="size-4" />
          {t('back')}
        </Link>
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {t('noRule')}
        </p>
      </div>
    );
  }

  const ruleType = (MOTHER_RULE_TYPES as readonly string[]).includes(rule.rule_type)
    ? (rule.rule_type as MotherRuleType)
    : 'fixed_amount';

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/dashboard/points-rules"
        >
          <ArrowLeft className="size-4" />
          {t('back')}
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CircleDot
                className={`size-3.5 ${rule.is_active ? 'text-brand-green' : 'text-muted-foreground'}`}
              />
              {rule.is_active ? t('statusActive') : t('statusInactive')}
            </p>
            {rule.updated_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                <span suppressHydrationWarning>
                  {t('lastUpdate', { date: formatDateTime(rule.updated_at, 'es-AR') })}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <MotherRuleForm
        branches={(branchRows ?? []).map((branch) => ({
          id: String(branch.id),
          name: branch.name as string,
        }))}
        rule={{
          id: rule.id,
          name: rule.name,
          ruleType,
          value: readValue(rule),
          branchId: rule.branch_id === null ? '' : String(rule.branch_id),
          isActive: rule.is_active,
        }}
      />
    </div>
  );
}
