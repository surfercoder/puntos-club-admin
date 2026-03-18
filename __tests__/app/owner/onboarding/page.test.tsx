import { redirect } from 'next/navigation';
import OwnerOnboardingPage from '@/app/owner/onboarding/page';

jest.mock('@/actions/onboarding/actions', () => ({
  getOnboardingStatus: jest.fn(() => Promise.resolve({ success: true, status: 'unauthenticated' })),
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: null } })) },
  })),
}));
jest.mock('@/components/onboarding/onboarding-wizard', () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard" />,
}));

describe('OwnerOnboardingPage', () => {
  it('exports a default async function', () => { expect(typeof OwnerOnboardingPage).toBe('function'); });

  it('redirects when no step param', async () => {
    await OwnerOnboardingPage({ searchParams: Promise.resolve({}) });
    expect(redirect).toHaveBeenCalledWith('/owner/onboarding?step=1');
  });

  it('renders wizard with step param', async () => {
    const result = await OwnerOnboardingPage({ searchParams: Promise.resolve({ step: '1' }) });
    expect(result).toBeTruthy();
  });

  it('passes complete onboarding data when status is complete', async () => {
    const { getOnboardingStatus } = require('@/actions/onboarding/actions');
    getOnboardingStatus.mockResolvedValueOnce({
      success: true,
      status: 'complete',
      data: { organizationId: 42, org: { name: 'My Org' } },
    });
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1', email: 'test@test.com', user_metadata: { first_name: 'John', last_name: 'Doe' } } } })) },
    });
    const result = await OwnerOnboardingPage({ searchParams: Promise.resolve({ step: '3' }) });
    expect(result).toBeTruthy();
  });

  it('handles non-complete status with authenticated user (step1Completed true)', async () => {
    const { getOnboardingStatus } = require('@/actions/onboarding/actions');
    getOnboardingStatus.mockResolvedValueOnce({
      success: true,
      status: 'pending',
    });
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1', email: 'test@test.com', user_metadata: {} } } })) },
    });
    const result = await OwnerOnboardingPage({ searchParams: Promise.resolve({ step: '2' }) });
    expect(result).toBeTruthy();
  });

  it('handles complete status with no organizationId in data', async () => {
    const { getOnboardingStatus } = require('@/actions/onboarding/actions');
    getOnboardingStatus.mockResolvedValueOnce({
      success: true,
      status: 'complete',
      data: { org: {} },
    });
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1', email: null, user_metadata: null } } })) },
    });
    const result = await OwnerOnboardingPage({ searchParams: Promise.resolve({ step: '1' }) });
    expect(result).toBeTruthy();
  });

  it('handles failed onboarding status', async () => {
    const { getOnboardingStatus } = require('@/actions/onboarding/actions');
    getOnboardingStatus.mockResolvedValueOnce({
      success: false,
      status: 'error',
    });
    const result = await OwnerOnboardingPage({ searchParams: Promise.resolve({ step: '1' }) });
    expect(result).toBeTruthy();
  });
});
