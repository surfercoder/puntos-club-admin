'use client';

import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QRHowItWorksCard() {
  const t = useTranslations('Dashboard.qr.display');

  const steps = [
    { id: 'step1', title: t('step1Title'), desc: t('step1Description') },
    { id: 'step2', title: t('step2Title'), desc: t('step2Description') },
    { id: 'step3', title: t('step3Title'), desc: t('step3Description') },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="size-4 text-primary" />
          {t('howItWorks')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((item, idx) => (
            <li key={item.id} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                {idx + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function QRTipsCard() {
  const t = useTranslations('Dashboard.qr.display');

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-4">
        <p className="text-sm font-medium text-primary mb-2">
          {t('tipsTitle')}
        </p>
        <ul className="space-y-1.5 text-xs text-primary/80">
          <li>• {t('tip1')}</li>
          <li>• {t('tip2')}</li>
          <li>• {t('tip3')}</li>
        </ul>
      </CardContent>
    </Card>
  );
}
