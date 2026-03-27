import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/actions/dashboard/organization/actions', () => ({
  updateOrganizationVisibility: jest.fn(),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: (props: any) => (
    <button
      data-testid="switch"
      onClick={() => props.onCheckedChange(!props.checked)}
      disabled={props.disabled}
      aria-label={props['aria-label']}
    >
      {props.checked ? 'on' : 'off'}
    </button>
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('lucide-react', () => ({
  Globe: () => <div data-testid="globe-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
}));

import { OrgVisibilityToggle } from '@/components/dashboard/organization/org-visibility-toggle';
import { updateOrganizationVisibility } from '@/actions/dashboard/organization/actions';
import { toast } from 'sonner';

describe('OrgVisibilityToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with public state (shows Globe icon, public text)', () => {
    render(<OrgVisibilityToggle orgId="5" initialIsPublic={true} />);

    expect(screen.getByTestId('globe-icon')).toBeTruthy();
    expect(screen.getByText('visibilityPublic')).toBeTruthy();
    expect(screen.getByText('visibilityPublicDescription')).toBeTruthy();
    expect(screen.getByTestId('switch')).toHaveTextContent('on');
  });

  it('renders with private state (shows Lock icon, private text)', () => {
    render(<OrgVisibilityToggle orgId="5" initialIsPublic={false} />);

    expect(screen.getByTestId('lock-icon')).toBeTruthy();
    expect(screen.getByText('visibilityPrivate')).toBeTruthy();
    expect(screen.getByText('visibilityPrivateDescription')).toBeTruthy();
    expect(screen.getByTestId('switch')).toHaveTextContent('off');
  });

  it('toggles visibility successfully with success toast', async () => {
    (updateOrganizationVisibility as jest.Mock).mockResolvedValueOnce({ error: null });

    render(<OrgVisibilityToggle orgId="5" initialIsPublic={true} />);

    fireEvent.click(screen.getByTestId('switch'));

    await waitFor(() => {
      expect(updateOrganizationVisibility).toHaveBeenCalledWith('5', false);
      expect(toast.success).toHaveBeenCalledWith('madePrivateSuccess');
    });

    expect(screen.getByTestId('switch')).toHaveTextContent('off');
  });

  it('shows madePublicSuccess toast when toggling from private to public', async () => {
    (updateOrganizationVisibility as jest.Mock).mockResolvedValueOnce({ error: null });

    render(<OrgVisibilityToggle orgId="5" initialIsPublic={false} />);

    fireEvent.click(screen.getByTestId('switch'));

    await waitFor(() => {
      expect(updateOrganizationVisibility).toHaveBeenCalledWith('5', true);
      expect(toast.success).toHaveBeenCalledWith('madePublicSuccess');
    });

    expect(screen.getByTestId('switch')).toHaveTextContent('on');
  });

  it('shows error toast and reverts on failure', async () => {
    (updateOrganizationVisibility as jest.Mock).mockResolvedValueOnce({ error: 'Failed' });

    render(<OrgVisibilityToggle orgId="5" initialIsPublic={true} />);

    fireEvent.click(screen.getByTestId('switch'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('updateError');
    });

    // Should revert back to original state
    expect(screen.getByTestId('switch')).toHaveTextContent('on');
  });

  it('switch is disabled while pending', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (updateOrganizationVisibility as jest.Mock).mockReturnValueOnce(pendingPromise);

    render(<OrgVisibilityToggle orgId="5" initialIsPublic={true} />);

    fireEvent.click(screen.getByTestId('switch'));

    await waitFor(() => {
      expect(screen.getByTestId('switch')).toBeDisabled();
    });

    // Resolve the pending action
    resolvePromise!({ error: null });

    await waitFor(() => {
      expect(screen.getByTestId('switch')).not.toBeDisabled();
    });
  });
});
