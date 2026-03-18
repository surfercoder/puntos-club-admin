import { notFound } from 'next/navigation';
import EditStockPage from '@/app/dashboard/stock/edit/[id]/page';

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: '1', branch: { organization_id: 1 }, quantity: 10, minimum_quantity: 5 },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));
jest.mock('@/components/dashboard/stock/stock-form', () => function Mock() { return <div data-testid="stock-form" />; });
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EditStockPage', () => {
  it('exports a default async function', () => { expect(typeof EditStockPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await EditStockPage({ params: Promise.resolve({ id: '1' }) }); expect(result).toBeTruthy(); });

  it('calls notFound when stock belongs to different organization', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: '1', branch: { organization_id: 999 }, quantity: 10, minimum_quantity: 5 },
              error: null,
            })),
          })),
        })),
      })),
    });
    await EditStockPage({ params: Promise.resolve({ id: '1' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('renders error when fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'fail' } })),
          })),
        })),
      })),
    });
    const result = await EditStockPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when data is null', async () => {
    const { notFound: mockNotFound } = require('next/navigation');
    mockNotFound.mockImplementationOnce(() => { throw new Error('NEXT_NOT_FOUND'); });
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
    await expect(EditStockPage({ params: Promise.resolve({ id: '999' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('handles no active_org_id cookie (skips org check)', async () => {
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    const result = await EditStockPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });
});
