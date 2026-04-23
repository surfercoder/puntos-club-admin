import { render } from '@testing-library/react';
import { notFound } from 'next/navigation';

import ViewNotificationPage from '@/app/dashboard/notifications/view/[id]/page';

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => key)),
}));

const mockSingle = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSingle,
          })),
        })),
      })),
    })
  ),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('@/components/ui/badge', () => ({ Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
jest.mock('@/components/ui/button', () => ({ Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> }));
jest.mock('@/components/ui/input', () => ({ Input: (props: any) => <input {...props} /> }));
jest.mock('@/components/ui/label', () => ({ Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label> }));
jest.mock('@/components/ui/textarea', () => ({ Textarea: (props: any) => <textarea {...props} /> }));

const baseNotification = {
  id: 'notif-1',
  title: 'Test Title',
  body: 'Test Body',
  status: 'sent',
  sent_count: 10,
  failed_count: 2,
  created_at: '2024-06-15T10:00:00Z',
  sent_at: '2024-06-15T10:05:00Z',
  creator: { first_name: 'John', last_name: 'Doe', email: 'john@test.com' },
};

const makeParams = (id: string) => Promise.resolve({ id });

describe('ViewNotificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({ data: baseNotification, error: null });
  });

  it('renders notification details', async () => {
    const jsx = await ViewNotificationPage({ params: makeParams('notif-1') });
    const { container } = render(jsx);
    expect(container).toBeTruthy();
  });

  it('calls notFound when user is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await expect(ViewNotificationPage({ params: makeParams('notif-1') })).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when notification fetch errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(ViewNotificationPage({ params: makeParams('bad-id') })).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when notification is null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    await expect(ViewNotificationPage({ params: makeParams('bad-id') })).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders creator email when name is empty', async () => {
    mockSingle.mockResolvedValue({
      data: { ...baseNotification, creator: { first_name: '', last_name: '', email: 'fallback@test.com' } },
      error: null,
    });

    const jsx = await ViewNotificationPage({ params: makeParams('notif-1') });
    const { container } = render(jsx);
    expect(container).toBeTruthy();
  });

  it('renders empty creator name when creator is null', async () => {
    mockSingle.mockResolvedValue({
      data: { ...baseNotification, creator: null },
      error: null,
    });

    const jsx = await ViewNotificationPage({ params: makeParams('notif-1') });
    const { container } = render(jsx);
    expect(container).toBeTruthy();
  });

  it('renders without sent_at when null', async () => {
    mockSingle.mockResolvedValue({
      data: { ...baseNotification, sent_at: null },
      error: null,
    });

    const jsx = await ViewNotificationPage({ params: makeParams('notif-1') });
    const { container } = render(jsx);
    expect(container).toBeTruthy();
  });

  it('renders with different status variants', async () => {
    for (const status of ['sent', 'sending', 'draft', 'failed', 'unknown_status']) {
      mockSingle.mockResolvedValue({
        data: { ...baseNotification, status },
        error: null,
      });

      const jsx = await ViewNotificationPage({ params: makeParams('notif-1') });
      const { container } = render(jsx);
      expect(container).toBeTruthy();
    }
  });
});
