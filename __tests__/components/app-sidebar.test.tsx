import { render, screen } from '@testing-library/react';
import { AppSidebar } from '@/components/app-sidebar';

// Mock child components to isolate the sidebar
jest.mock('@/components/nav-main', () => ({
  NavMain: ({ items }: { items: unknown[] }) => (
    <div data-testid="nav-main">{items.length} items</div>
  ),
}));

jest.mock('@/components/nav-projects', () => ({
  NavProjects: () => <div data-testid="nav-projects">Projects</div>,
}));

jest.mock('@/components/nav-user', () => ({
  NavUser: ({ user }: { user: { name: string } }) => (
    <div data-testid="nav-user">{user.name}</div>
  ),
}));

jest.mock('@/components/org-switcher', () => ({
  OrgSwitcher: ({ activeOrgId }: { activeOrgId: string | null }) => (
    <div data-testid="org-switcher">{activeOrgId}</div>
  ),
}));

jest.mock('@/components/plan-badge', () => ({
  PlanBadge: () => <div data-testid="plan-badge">Plan Badge</div>,
}));

jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="sidebar" {...props}>{children}</div>
  ),
  SidebarContent: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sidebar-content">{children}</div>
  ),
  SidebarFooter: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sidebar-footer">{children}</div>
  ),
  SidebarHeader: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sidebar-header">{children}</div>
  ),
  SidebarRail: () => <div data-testid="sidebar-rail" />,
  SidebarGroup: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sidebar-group">{children}</div>
  ),
  SidebarMenu: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sidebar-menu">{children}</div>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => (
    <div data-testid="sidebar-menu-item">{children}</div>
  ),
  SidebarMenuButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="sidebar-menu-button" {...props}>{children}</div>
  ),
}));

describe('AppSidebar', () => {
  const defaultProps = {
    user: { name: 'John Doe', email: 'john@test.com' },
    userRole: 'owner' as const,
    orgs: [{ id: 'org-1', name: 'Test Org' }],
    activeOrgId: 'org-1',
    onChangeOrg: jest.fn(),
    onLogout: jest.fn(),
    portalMode: 'org' as const,
  };

  it('renders sidebar structure', () => {
    render(<AppSidebar {...defaultProps} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
  });

  it('renders nav-main with items', () => {
    render(<AppSidebar {...defaultProps} />);
    expect(screen.getByTestId('nav-main')).toBeInTheDocument();
  });

  it('renders nav-user with user info', () => {
    render(<AppSidebar {...defaultProps} />);
    expect(screen.getByTestId('nav-user')).toHaveTextContent('John Doe');
  });

  it('renders org-switcher in org mode', () => {
    render(<AppSidebar {...defaultProps} />);
    expect(screen.getByTestId('org-switcher')).toBeInTheDocument();
  });

  it('does not render org-switcher in admin mode', () => {
    render(<AppSidebar {...defaultProps} portalMode="admin" />);
    expect(screen.queryByTestId('org-switcher')).not.toBeInTheDocument();
  });

  it('does not render nav-projects for owner role', () => {
    render(<AppSidebar {...defaultProps} userRole="owner" />);
    expect(screen.queryByTestId('nav-projects')).not.toBeInTheDocument();
  });

  it('does not render nav-projects for collaborator role', () => {
    render(<AppSidebar {...defaultProps} userRole="collaborator" />);
    expect(screen.queryByTestId('nav-projects')).not.toBeInTheDocument();
  });

  it('renders nav-projects for non-owner, non-admin mode', () => {
    render(<AppSidebar {...defaultProps} userRole="cashier" portalMode="org" />);
    expect(screen.getByTestId('nav-projects')).toBeInTheDocument();
  });

  it('does not render nav-projects in admin mode', () => {
    render(<AppSidebar {...defaultProps} userRole="cashier" portalMode="admin" />);
    expect(screen.queryByTestId('nav-projects')).not.toBeInTheDocument();
  });
});
