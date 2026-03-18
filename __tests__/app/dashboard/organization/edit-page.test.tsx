import { notFound } from 'next/navigation';
import EditOrganizationPage from '@/app/dashboard/organization/edit/[id]/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: { id: '1', name: 'Test Org' }, error: null })) })) })) })) })) }));
jest.mock('@/components/dashboard/organization/organization-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('EditOrganizationPage', () => {
  it('exports a default async function', () => { expect(typeof EditOrganizationPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await EditOrganizationPage({ params: Promise.resolve({ id: '1' }) }); expect(result).toBeTruthy(); });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })) })) })) })),
    });
    const result = await EditOrganizationPage({ params: Promise.resolve({ id: '999' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when data is null', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: null })) })) })) })),
    });
    await EditOrganizationPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });
});
