import React from 'react';
import { render } from '@testing-library/react';

const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({ redirect: (...args: any[]) => mockRedirect(...args) }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: jest.fn(() => ({ value: '5' })) })),
}));
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => Promise.resolve((key: string) => key)) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ id: 1, organization_id: 5, role: { name: 'owner' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  hasOwnerPermissions: jest.fn(() => true),
}));
jest.mock('@/actions/dashboard/organization/actions', () => ({
  getOrganizationSettings: jest.fn(() => Promise.resolve({ data: { id: 5, name: 'Test Org', is_public: true }, error: null })),
  getOrganizationAddress: jest.fn(() => Promise.resolve({ data: { id: 7, street: 'Belgrano' }, error: null })),
}));
jest.mock('@/components/dashboard/organization/club-profile-form', () => ({
  ClubProfileForm: (props: any) => (
    <div
      data-testid="club-profile-form"
      data-org-id={props.organization.id}
      data-street={props.address?.street}
    />
  ),
}));
jest.mock('@/components/dashboard/home/gift-illustration', () => ({
  GiftIllustration: () => <div data-testid="gift" />,
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import OrgSettingsPage from '@/app/dashboard/settings/organization/page';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { hasOwnerPermissions } from '@/lib/auth/roles';
import { getOrganizationSettings } from '@/actions/dashboard/organization/actions';
import { cookies } from 'next/headers';

describe('OrgSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default redirect does nothing (happy path won't call it)
    mockRedirect.mockImplementation(() => {});
  });

  it('renders the club profile form for the active organization', async () => {
    const page = await OrgSettingsPage();
    const { getByTestId } = render(page);

    expect(getByTestId('club-profile-form')).toHaveAttribute('data-org-id', '5');
    expect(getByTestId('club-profile-form')).toHaveAttribute('data-street', 'Belgrano');
    expect(getByTestId('gift')).toBeTruthy();
  });

  it('redirects when user is not authorized (not owner/admin)', async () => {
    (hasOwnerPermissions as jest.Mock).mockReturnValueOnce(false);
    mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });

    await expect(OrgSettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects when no activeOrgId', async () => {
    (cookies as jest.Mock).mockResolvedValueOnce({ get: jest.fn(() => undefined) });
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({
      id: 1,
      organization_id: null,
      role: { name: 'owner' },
    });
    mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });

    await expect(OrgSettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects when org data returns error', async () => {
    (getOrganizationSettings as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: 'Not found',
    });
    mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });

    await expect(OrgSettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects when user is null', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);
    mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });

    await expect(OrgSettingsPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});
