import { notFound } from 'next/navigation';
import EditAddressPage from '@/app/dashboard/address/edit/[id]/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => Promise.resolve({ from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn().mockReturnThis(), single: jest.fn(() => Promise.resolve({ data: { id: '1', street: 'Test St', organization_id: 1 }, error: null })) })) })) })) })) }));
jest.mock('@/components/dashboard/address/address-form', () => function Mock() { return <div />; });
jest.mock('@/components/ui/card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('EditAddressPage', () => {
  it('exports a default async function', () => { expect(typeof EditAddressPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await EditAddressPage({ params: Promise.resolve({ id: '1' }) }); expect(result).toBeTruthy(); });

  it('calls notFound when data is null', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    });
    await EditAddressPage({ params: Promise.resolve({ id: '999' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })),
          })),
        })),
      })),
    });
    const result = await EditAddressPage({ params: Promise.resolve({ id: '999' }) });
    expect(result).toBeTruthy();
  });

  it('handles no active_org_id cookie (null branch)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    const result = await EditAddressPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });
});
