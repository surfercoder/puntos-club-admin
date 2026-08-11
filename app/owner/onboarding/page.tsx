import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { getOnboardingStatus } from '@/actions/onboarding/actions';
import { createClient } from '@/lib/supabase/server';
import type { Step1CompletedData } from '@/components/onboarding/wizard-state';

export const metadata: Metadata = {
  title: 'Onboarding',
  description: 'Configure tu organización para comenzar a usar Puntos Club.',
};

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function OwnerOnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Always require an explicit step in the URL so the route is never cached
  // without one. Without this, Next.js may serve a stale cached response that
  // lands the user on the wrong step.
  if (!params.step) {
    redirect('/owner/onboarding?step=1');
  }

  const requestedStep = parseInt(params.step, 10);

  // Run both fetches in parallel
  const [statusResult, supabase] = await Promise.all([
    getOnboardingStatus(),
    createClient(),
  ]);

  // A user who already finished onboarding has nothing to configure here —
  // send them to the dashboard instead of showing a stale "step 1 completed"
  // card for their old account. (To register a new account, log out first.)
  if (statusResult.success && statusResult.status === 'complete') {
    redirect('/dashboard');
  }

  // Derive step-1 completion from auth state — independent of URL param
  const step1Completed =
    statusResult.success && statusResult.status !== 'unauthenticated';

  // Pull user identity directly from the session (metadata written at signup)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialUserInfo: Step1CompletedData | null = user
    ? {
        firstName: user.user_metadata?.first_name ?? '',
        lastName: user.user_metadata?.last_name ?? '',
        email: user.email ?? '',
      }
    : null;

  return (
    <OnboardingWizard
      initialStep={requestedStep}
      initialStep1Completed={step1Completed}
      initialUserInfo={initialUserInfo}
      initialOrganizationId={null}
      initialOrgName=""
    />
  );
}
