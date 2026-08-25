import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { NavMain } from '@/components/nav-main';
import { Store, Users } from 'lucide-react';

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, defaultOpen, asChild: _asChild, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="collapsible" data-open={String(defaultOpen)} {...props}>{children}</div>
  ),
  CollapsibleContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CollapsibleTrigger: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarMenu: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => <li>{children}</li>,
  SidebarMenuSub: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuSubButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  SidebarMenuSubItem: ({ children }: React.PropsWithChildren) => <li>{children}</li>,
}));

const mockUsePathname = usePathname as jest.Mock;

describe('NavMain', () => {
  afterEach(() => { mockUsePathname.mockReturnValue('/'); });

  it('renders flat items without sub-items as links', () => {
    const items = [
      { title: 'Branches', url: '/dashboard/branch', icon: Store },
      { title: 'Users', url: '/dashboard/users', icon: Users },
    ];

    render(<NavMain items={items} />);
    expect(screen.getByText('Branches')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();

    const branchLink = screen.getByText('Branches').closest('a');
    expect(branchLink).toHaveAttribute('href', '/dashboard/branch');
  });

  it('renders items with sub-items as collapsible', () => {
    const items = [
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: Store,
        items: [
          { title: 'Branches', url: '/dashboard/branch' },
          { title: 'Products', url: '/dashboard/product' },
        ],
      },
    ];

    render(<NavMain items={items} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Branches')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('renders group label', () => {
    render(<NavMain items={[]} />);
    expect(screen.getByText('entities')).toBeInTheDocument();
  });

  it('renders empty menu when no items', () => {
    const { container } = render(<NavMain items={[]} />);
    expect(container.querySelector('ul')).toBeInTheDocument();
  });

  it('opens the group that matches the route when the pathname changes', () => {
    const items = [
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: Store,
        items: [{ title: 'Branches', url: '/dashboard/branch' }],
      },
    ];

    mockUsePathname.mockReturnValue('/dashboard/otra-cosa');
    const { rerender } = render(<NavMain items={items} />);
    expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'false');

    // Al navegar a una pagina del grupo cerrado, el grupo tiene que abrirse.
    mockUsePathname.mockReturnValue('/dashboard/branch');
    rerender(<NavMain items={items} />);
    expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'true');
  });

  it('keeps a group open when the item is flagged as active', () => {
    const items = [
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: Store,
        isActive: true,
        items: [{ title: 'Branches', url: '/dashboard/branch' }],
      },
    ];

    render(<NavMain items={items} />);
    expect(screen.getByTestId('collapsible')).toHaveAttribute('data-open', 'true');
  });
});
