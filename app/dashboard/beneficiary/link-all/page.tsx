"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { linkAllUnlinkedBeneficiaries } from '@/actions/dashboard/beneficiary/link-to-organization';

export default function LinkAllBeneficiariesPage() {
  const t = useTranslations('Dashboard.beneficiaryLinkAll');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { push } = useRouter();

  const handleLinkAll = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await linkAllUnlinkedBeneficiaries();

      if (error) {
        setResult({
          success: false,
          message: error.message || t('linkFailed'),
        });
      } else {
        setResult({
          success: true,
          message: data?.message || t('linkSuccess'),
        });
      }
    } catch {
      setResult({
        success: false,
        message: t('unexpectedError'),
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <p>{result.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleLinkAll}
              disabled={loading}
              className="flex-1"
            >
              {loading ? t('linking') : t('linkButton')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => push('/dashboard/beneficiary')}
              disabled={loading}
            >
              {t('backButton')}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">{t('whatThisDoes')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('step1')}</li>
              <li>{t('step2')}</li>
              <li>{t('step3')}</li>
              <li>{t('step4')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
