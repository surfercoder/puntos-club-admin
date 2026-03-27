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
  isOwner: jest.fn(() => true),
  isAdmin: jest.fn(() => false),
}));
jest.mock('@/actions/dashboard/organization/actions', () => ({
  getOrganizationSettings: jest.fn(() => Promise.resolve({ data: { id: 5, name: 'Test Org', is_public: true }, error: null })),
}));
jest.mock('@/components/dashboard/organization/org-visibility-toggle', () => ({
  OrgVisibilityToggle: (props: any) => <div data-testid="org-visibility-toggle" data-org-id={props.orgId} />,
}));
jest.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon" />,
}));

import OrgSettingsPage from '@/app/dashboard/settings/organization/page';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isOwner, isAdmin } from '@/lib/auth/roles';
import { getOrganizationSettings } from '@/actions/dashboard/organization/actions';
import { cookies } from 'next/headers';

describe('OrgSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default redirect does nothing (happy path won't call it)
    mockRedirect.mockImplementation(() => {});
  });

  it('renders settings page with org name', async () => {
    const page = await OrgSettingsPage();
    const { getByText, getByTestId } = render(page);

    expect(getByText('Test Org')).toBeTruthy();
    expect(getByTestId('settings-icon')).toBeTruthy();
    expect(getByTestId('org-visibility-toggle')).toBeTruthy();
  });

  it('redirects when user is not authorized (not owner/admin)', async () => {
    (isOwner as jest.Mock).mockReturnValueOnce(false);
    (isAdmin as jest.Mock).mockReturnValueOnce(false);
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
