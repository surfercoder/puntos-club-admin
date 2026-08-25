import { CircleCheck, Headphones, Lock, ShieldCheck, Tag } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Clubi } from '@/components/dashboard/home/clubi';
import { PlanSelector } from '@/components/dashboard/plan/plan-selector';

const TRUST = [
  { key: 'payments', icon: ShieldCheck, tint: 'bg-brand-violet/10 text-brand-violet' },
  { key: 'data', icon: Lock, tint: 'bg-brand-blue/10 text-brand-blue' },
  { key: 'noHiddenFees', icon: Tag, tint: 'bg-brand-green/10 text-brand-green' },
  { key: 'support', icon: Headphones, tint: 'bg-brand-orange/10 text-brand-orange' },
] as const;

export default async function PlanSettingsPage() {
  const t = await getTranslations('Dashboard.planSettings');

  return (
    <div className="space-y-6">
      <div className="grid items-center gap-6 rounded-xl border bg-card p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Clubi accent="#FF4573" className="h-24 w-20 shrink-0" />
          <p className="max-w-xs rounded-xl bg-brand-pink/5 p-4 text-sm">
            <span className="block font-semibold text-brand-pink">{t('clubi.greeting')}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{t('clubi.body')}</span>
          </p>
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {TRUST.map(({ key, icon: Icon, tint }) => (
          <div key={key} className="flex items-start gap-3">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tint}`}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{t(`trust.${key}.title`)}</span>
              <span className="block text-xs text-muted-foreground">
                {t(`trust.${key}.description`)}
              </span>
            </span>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PlanSelector />
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">{t('mercadoPago.title')}</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t('mercadoPago.body')}
            </p>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CircleCheck className="size-4 text-brand-green" />
              {t('guarantee.title')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t('guarantee.body')}
            </p>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Headphones className="size-4 text-brand-violet" />
              {t('help.title')}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t('help.body')}</p>
            <Link
              className="brand-cta mt-4 inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium"
              href="/dashboard"
            >
              {t('help.cta')}
            </Link>
          </section>
        </div>
      </div>

      <p className="flex items-start gap-3 rounded-xl border bg-brand-violet/5 p-5 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand-violet" />
        <span className="min-w-0 flex-1">{t('footerNote')}</span>
        <span className="shrink-0">{t('taxNote')}</span>
      </p>
    </div>
  );
}
