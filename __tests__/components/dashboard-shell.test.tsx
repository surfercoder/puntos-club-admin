import { render, screen, fireEvent, act } from '@testing-library/react';
import { DashboardShell } from '@/components/dashboard-shell';

let _capturedOnChangeOrg: ((orgId: string) => void) | undefined;
let _capturedOnLogout: (() => void) | undefined;

// Mock all heavy child components
jest.mock('@/components/app-sidebar', () => ({
  AppSidebar: (props: { onChangeOrg: (id: string) => void; onLogout: () => void }) => {
    _capturedOnChangeOrg = props.onChangeOrg;
    _capturedOnLogout = props.onLogout;
    return (
      <div data-testid="app-sidebar">
        <button data-testid="change-org-btn" onClick={() => props.onChangeOrg('org-99')}>Change Org</button>
        <button data-testid="logout-btn" onClick={props.onLogout}>Logout</button>
      </div>
    );
  },
}));

jest.mock('@/components/dashboard/tour/dashboard-tour', () => ({
  DashboardTour: () => null,
}));

jest.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Lang</div>,
}));

jest.mock('@/components/providers/plan-usage-provider', () => ({
  PlanUsageProvider: ({ children }: React.PropsWithChildren) => <div data-testid="plan-provider">{children}</div>,
  usePlanUsage: jest.fn(),
}));

jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }: React.PropsWithChildren) => <nav>{children}</nav>,
  BreadcrumbItem: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  BreadcrumbLink: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a>,
  BreadcrumbList: ({ children }: React.PropsWithChildren) => <ol>{children}</ol>,
  BreadcrumbPage: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  BreadcrumbSeparator: () => <span>/</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarInset: ({ children }: React.PropsWithChildren) => <div data-testid="sidebar-inset">{children}</div>,
  SidebarProvider: ({ children }: React.PropsWithChildren) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
}));

describe('DashboardShell', () => {
  const defaultProps = {
    user: { name: 'John Doe', email: 'john@test.com' },
    userId: 'user-1',
    userRole: 'owner' as const,
    tourCompleted: true,
    orgs: [{ id: 'org-1', name: 'Test Org' }],
    portalMode: 'org' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    _capturedOnChangeOrg = undefined;
    _capturedOnLogout = undefined;
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({});
  });

  it('renders sidebar provider', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('renders app sidebar', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div data-testid="child-content">Dashboard Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders plan usage provider', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId('plan-provider')).toBeInTheDocument();
  });

  it('renders language switcher', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('renders sidebar trigger button', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument();
  });

  it('renders breadcrumb with panel', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText('panel')).toBeInTheDocument();
  });

  it('generates breadcrumbs from pathname segments', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/beneficiary/new');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('panel')).toBeInTheDocument();
    expect(screen.getByText('beneficiary')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('generates edit breadcrumb segment', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/product/edit');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('product')).toBeInTheDocument();
    expect(screen.getByText('edit')).toBeInTheDocument();
  });

  it('generates details breadcrumb for UUID segments', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/users/550e8400-e29b-41d4-a716-446655440000');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('details')).toBeInTheDocument();
  });

  it('generates details breadcrumb for numeric ID segments', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/organization/123');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('organization')).toBeInTheDocument();
    expect(screen.getByText('details')).toBeInTheDocument();
  });

  it('uses segment as-is for unknown segments', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/unknown-segment');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('unknown-segment')).toBeInTheDocument();
  });

  it('reads active_org_id from localStorage on mount for org mode', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('org-42');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(window.localStorage.getItem).toHaveBeenCalledWith('active_org_id');
  });

  it('does not read localStorage for admin portal mode', () => {
    render(
      <DashboardShell {...defaultProps} portalMode="admin">
        <div>Content</div>
      </DashboardShell>
    );

    expect(window.localStorage.getItem).not.toHaveBeenCalled();
  });

  it('handles localStorage read error gracefully', () => {
    (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage error');
    });

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument();
  });

  it('onChangeOrg saves to localStorage, calls fetch, and dispatches event for org mode', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('change-org-btn'));
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith('active_org_id', 'org-99');
    expect(global.fetch).toHaveBeenCalledWith('/api/active-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: 'org-99' }),
    });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'orgChanged', detail: { orgId: 'org-99' } })
    );

    dispatchSpy.mockRestore();
  });

  it('onChangeOrg does nothing for admin portal mode', () => {
    render(
      <DashboardShell {...defaultProps} portalMode="admin">
        <div>Content</div>
      </DashboardShell>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('change-org-btn'));
    });

    expect(window.localStorage.setItem).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('onChangeOrg handles localStorage setItem error gracefully', () => {
    (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('Storage full');
    });

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    // Should not throw
    act(() => {
      fireEvent.click(screen.getByTestId('change-org-btn'));
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('onChangeOrg handles fetch error gracefully', () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    // Should not throw
    act(() => {
      fireEvent.click(screen.getByTestId('change-org-btn'));
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('onLogout signs out and redirects to login', async () => {
    const { useRouter } = require('next/navigation');
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });

    const { createClient } = require('@/lib/supabase/client');
    const signOutMock = jest.fn().mockResolvedValue({});
    (createClient as jest.Mock).mockReturnValue({
      auth: { signOut: signOutMock },
    });

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    expect(signOutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/auth/login');
  });

  it('generates empty breadcrumbs for /dashboard root', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('panel')).toBeInTheDocument();
    // No extra breadcrumb segments beyond Panel
  });

  it('handles null pathname', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue(null);

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('panel')).toBeInTheDocument();
  });

  it('renders breadcrumb link for non-last items', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/product/new');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/dashboard')).toBe(true);
    expect(links.some(l => l.getAttribute('href') === '/dashboard/product')).toBe(true);
  });

  it('generates breadcrumbs for all known segments', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/address');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('address')).toBeInTheDocument();
  });

  it('dispatches orgChanged event when changing org (typeof window check line 143)', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('change-org-btn'));
    });

    // Verify the orgChanged event was dispatched (covers typeof window !== 'undefined' branch)
    const orgChangedEvents = dispatchSpy.mock.calls.filter(
      (c) => (c[0] as Event).type === 'orgChanged'
    );
    expect(orgChangedEvents.length).toBe(1);

    dispatchSpy.mockRestore();
  });

  it('handles breadcrumbs with query params and hash', () => {
    const { usePathname } = require('next/navigation');
    (usePathname as jest.Mock).mockReturnValue('/dashboard/product?foo=bar#section');

    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );

    expect(screen.getByText('product')).toBeInTheDocument();
  });
});
