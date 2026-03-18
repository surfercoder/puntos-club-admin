import { notFound } from 'next/navigation';
import EditRedemptionPage from '@/app/dashboard/redemption/edit/[id]/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: { id: '1' }, error: null })) })) })) })) })) }));
jest.mock('@/components/dashboard/redemption/redemption-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('EditRedemptionPage', () => {
  it('exports a default async function', () => { expect(typeof EditRedemptionPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await EditRedemptionPage({ params: Promise.resolve({ id: '1' }) }); expect(result).toBeTruthy(); });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })) })) })) })),
    });
    const result = await EditRedemptionPage({ params: Promise.resolve({ id: '999' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when data is null', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => Promise.resolve({ data: null, error: null })) })) })) })),
    });
    await EditRedemptionPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });
});
