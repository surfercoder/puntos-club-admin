import { notFound } from 'next/navigation';
import EditOrganizationNotificationLimitPage from '@/app/dashboard/organization_notification_limits/[id]/page';

const mockSingle = jest.fn();
const mockOrder = jest.fn();
const _mockEq = jest.fn();
const _mockSelect = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => {
        if (table === 'organization_notification_limits') {
          return {
            eq: jest.fn(() => ({
              single: mockSingle,
            })),
          };
        }
        // organization table
        return {
          order: mockOrder,
        };
      }),
    })),
  })),
}));

jest.mock('@/components/dashboard/organization_notification_limits/organization_notification_limit-form', () => {
  const Mock = () => <div data-testid="form" />;
  Mock.displayName = 'OrganizationNotificationLimitForm';
  return Mock;
});
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EditOrganizationNotificationLimitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: '1', daily_limit: 10 }, error: null });
    mockOrder.mockResolvedValue({ data: [{ id: '1', name: 'Org 1' }] });
  });

  it('exports a default async function', () => {
    expect(typeof EditOrganizationNotificationLimitPage).toBe('function');
  });

  it('renders form when data is found', async () => {
    const result = await EditOrganizationNotificationLimitPage({ params: { id: '1' } });
    expect(result).toBeTruthy();
  });

  it('calls notFound when limit data has error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    await EditOrganizationNotificationLimitPage({ params: { id: '999' } });
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when limit data is null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    await EditOrganizationNotificationLimitPage({ params: { id: '999' } });
    expect(notFound).toHaveBeenCalled();
  });

  it('renders with empty organizations list', async () => {
    mockOrder.mockResolvedValue({ data: null });

    const result = await EditOrganizationNotificationLimitPage({ params: { id: '1' } });
    expect(result).toBeTruthy();
  });
});
