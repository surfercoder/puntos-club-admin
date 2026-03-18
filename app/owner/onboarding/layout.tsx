import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    title: t('onboardingTitle'),
    description: t('onboardingDescription'),
  };
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
