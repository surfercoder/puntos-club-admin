import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { PublicHeader } from "@/components/public-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    title: t('onboardingTitle'),
    description: t('onboardingDescription'),
  };
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-br from-secondary via-background to-accent dark:from-background dark:via-background dark:to-background">
      <PublicHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
