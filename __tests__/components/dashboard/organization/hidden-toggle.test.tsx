import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockRefresh = jest.fn();

jest.mock('next-intl', () => ({ useTranslations: jest.fn(() => (key: string) => key) }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/actions/dashboard/organization/actions', () => ({ setOrganizationHidden: jest.fn() }));

import HiddenToggle from '@/components/dashboard/organization/hidden-toggle';
import { setOrganizationHidden } from '@/actions/dashboard/organization/actions';
import { toast } from 'sonner';

describe('HiddenToggle', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('hides a visible organization', async () => {
    (setOrganizationHidden as jest.Mock).mockResolvedValue({ error: null });
    render(<HiddenToggle organizationId="7" hidden={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'hide' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('hiddenSuccess'));
    expect(setOrganizationHidden).toHaveBeenCalledWith('7', true);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows a hidden organization again', async () => {
    (setOrganizationHidden as jest.Mock).mockResolvedValue({ error: null });
    render(<HiddenToggle organizationId="7" hidden />);
    fireEvent.click(screen.getByRole('button', { name: 'show' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('shownSuccess'));
    expect(setOrganizationHidden).toHaveBeenCalledWith('7', false);
  });

  it('toasts the error and does not refresh', async () => {
    (setOrganizationHidden as jest.Mock).mockResolvedValue({ error: 'db.forbidden' });
    render(<HiddenToggle organizationId="7" hidden={false} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('error'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
