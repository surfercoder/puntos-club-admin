import { notFound } from 'next/navigation';
import EditOrganizationPlanLimitPage from '@/app/dashboard/organization_plan_limits/edit/[id]/page';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: '1', name: 'Test Organization Plan Limit' },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

jest.mock('@/components/dashboard/organization_plan_limits/organization-plan-limit-form', () => {
  return function MockOrganizationPlanLimitForm() { return <div data-testid="organization-plan-limit-form" />; };
});

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EditOrganizationPlanLimitPage', () => {
  it('exports a default async function', () => {
    expect(typeof EditOrganizationPlanLimitPage).toBe('function');
  });

  it('renders without crashing', async () => {
    const result = await EditOrganizationPlanLimitPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } })),
          })),
        })),
      })),
    });

    await EditOrganizationPlanLimitPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when data is null and no error', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    });
    await EditOrganizationPlanLimitPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });
});
