import { notFound } from 'next/navigation';
import EditBeneficiaryPage from '@/app/dashboard/beneficiary/edit/[id]/page';

jest.mock('next/navigation', () => ({ notFound: jest.fn(), redirect: jest.fn() }));
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', role: { name: 'admin' }, organization_id: 'org-1' })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => true),
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: { id: '1', first_name: 'Test' }, error: null })) })) })) })),
  })),
}));
jest.mock('@/components/dashboard/beneficiary/beneficiary-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EditBeneficiaryPage', () => {
  it('exports a default async function', () => { expect(typeof EditBeneficiaryPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await EditBeneficiaryPage({ params: Promise.resolve({ id: '1' }) }); expect(result).toBeTruthy(); });

  it('calls notFound when data is null', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: null })) })) })) })),
    });
    await EditBeneficiaryPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('redirects to /dashboard/beneficiary when user is not admin', async () => {
    const { isAdmin } = require('@/lib/auth/roles');
    const { redirect } = require('next/navigation');
    (isAdmin as jest.Mock).mockReturnValueOnce(false);
    await EditBeneficiaryPage({ params: Promise.resolve({ id: '1' }) });
    expect(redirect).toHaveBeenCalledWith('/dashboard/beneficiary');
  });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })) })) })) })),
    });
    const result = await EditBeneficiaryPage({ params: Promise.resolve({ id: '999' }) });
    expect(result).toBeTruthy();
  });
});
