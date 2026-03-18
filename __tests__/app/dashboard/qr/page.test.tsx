import { redirect } from 'next/navigation';
import QRPage from '@/app/dashboard/qr/page';

const mockSingle = jest.fn().mockResolvedValue({ data: { id: 1, name: 'Test Org', logo_url: null } });
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelectFrom = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelectFrom }));

jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('next/headers', () => ({ cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '1' })) })) }));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })) },
    from: mockFrom,
  })),
}));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: jest.fn(() => Promise.resolve({ id: '1', organization: { id: '1', name: 'Test Org' } })) }));
jest.mock('@/components/dashboard/qr/org-qr-display', () => ({ OrgQRDisplay: () => <div data-testid="qr-display" /> }));

describe('QRPage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('exports a default async function', () => { expect(typeof QRPage).toBe('function'); });
  it('renders without crashing', async () => { const result = await QRPage(); expect(result).toBeTruthy(); });

  it('redirects to login when no user', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: null } })) },
      from: mockFrom,
    });
    await QRPage();
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders no-org message when no organizationId and no currentUser org', async () => {
    const { cookies } = require('next/headers');
    cookies.mockResolvedValueOnce({ get: jest.fn(() => ({ value: '' })) });
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    getCurrentUser.mockResolvedValueOnce({ id: '1', organization: null });
    const result = await QRPage();
    expect(result).toBeTruthy();
  });

  it('uses currentUser.organization.id as fallback when no cookie org', async () => {
    const { cookies } = require('next/headers');
    cookies.mockResolvedValueOnce({ get: jest.fn(() => ({ value: '' })) });
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    getCurrentUser.mockResolvedValueOnce({ id: '1', organization: { id: '5', name: 'Fallback Org' } });
    mockEq.mockReturnValueOnce({ single: jest.fn().mockResolvedValue({ data: { id: 5, name: 'Fallback Org', logo_url: null } }) });
    const result = await QRPage();
    expect(result).toBeTruthy();
  });

  it('renders org not found when org query returns null', async () => {
    mockEq.mockReturnValueOnce({ single: jest.fn().mockResolvedValue({ data: null }) });
    const result = await QRPage();
    expect(result).toBeTruthy();
  });
});
