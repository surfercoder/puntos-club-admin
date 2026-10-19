import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import EditOrganizationNotificationLimitPage from '@/app/dashboard/organization_notification_limits/[id]/page';

const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockCreditsOrder = jest.fn();
const mockCreditsEq = jest.fn((..._args: unknown[]) => ({ order: mockCreditsOrder }));

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
        if (table === 'notification_credit') {
          return { eq: mockCreditsEq };
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
const mockCreditsCard = jest.fn((_props: Record<string, unknown>) => <div data-testid="credits" />);
jest.mock('@/components/dashboard/organization_notification_limits/notification-credits-card', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => mockCreditsCard(props),
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EditOrganizationNotificationLimitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: { id: '1', organization_id: 4, daily_limit: 10, notifications_granted: 50, notifications_used: 8 },
      error: null,
    });
    mockOrder.mockResolvedValue({ data: [{ id: '1', name: 'Org 1' }] });
    mockCreditsOrder.mockResolvedValue({ data: [{ id: 1, amount: 50 }] });
    (notFound as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  it('passes the org balance and credit history to the credits card', async () => {
    render(await EditOrganizationNotificationLimitPage({ params: Promise.resolve({ id: '1' }) }));
    expect(screen.getByTestId('credits')).toBeInTheDocument();
    expect(mockCreditsEq).toHaveBeenCalledWith('organization_id', 4);
    expect(mockCreditsCard).toHaveBeenCalledWith({
      organizationId: '4',
      granted: 50,
      used: 8,
      credits: [{ id: 1, amount: 50 }],
    });
  });

  it('passes an empty history when the credits query returns null', async () => {
    mockCreditsOrder.mockResolvedValue({ data: null });
    render(await EditOrganizationNotificationLimitPage({ params: Promise.resolve({ id: '1' }) }));
    expect(mockCreditsCard).toHaveBeenCalledWith(expect.objectContaining({ credits: [] }));
  });

  it('exports a default async function', () => {
    expect(typeof EditOrganizationNotificationLimitPage).toBe('function');
  });

  it('renders form when data is found', async () => {
    const result = await EditOrganizationNotificationLimitPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });

  it('calls notFound when limit data has error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    await expect(EditOrganizationNotificationLimitPage({ params: Promise.resolve({ id: '999' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when limit data is null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    await expect(EditOrganizationNotificationLimitPage({ params: Promise.resolve({ id: '999' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders with empty organizations list', async () => {
    mockOrder.mockResolvedValue({ data: null });

    const result = await EditOrganizationNotificationLimitPage({ params: Promise.resolve({ id: '1' }) });
    expect(result).toBeTruthy();
  });
});
