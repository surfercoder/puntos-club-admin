import { render, screen } from '@testing-library/react';
import { NavProjects } from '@/components/nav-projects';
import { Frame, PieChart, Map } from 'lucide-react';

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarMenu: ({ children }: React.PropsWithChildren) => <ul>{children}</ul>,
  SidebarMenuAction: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarMenuButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => <li>{children}</li>,
  useSidebar: jest.fn(() => ({ isMobile: false })),
}));

describe('NavProjects', () => {
  const projects = [
    { name: 'Design Engineering', url: '#', icon: Frame },
    { name: 'Sales & Marketing', url: '#', icon: PieChart },
    { name: 'Travel', url: '#', icon: Map },
  ];

  it('renders project names', () => {
    render(<NavProjects projects={projects} />);
    expect(screen.getByText('Design Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sales & Marketing')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();
  });

  it('renders projects group label', () => {
    render(<NavProjects projects={projects} />);
    expect(screen.getByText('projects')).toBeInTheDocument();
  });

  it('renders "more" elements', () => {
    render(<NavProjects projects={projects} />);
    // "more" appears multiple times: sr-only spans per project + the "More" menu button
    expect(screen.getAllByText('more').length).toBeGreaterThanOrEqual(1);
  });

  it('renders project links', () => {
    render(<NavProjects projects={projects} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '#');
    });
  });

  it('renders dropdown menu options', () => {
    render(<NavProjects projects={projects} />);
    expect(screen.getAllByText('viewProject').length).toBe(3);
    expect(screen.getAllByText('shareProject').length).toBe(3);
    expect(screen.getAllByText('deleteProject').length).toBe(3);
  });

  it('renders with isMobile true (covers mobile branch)', () => {
    const { useSidebar } = require('@/components/ui/sidebar');
    (useSidebar as jest.Mock).mockReturnValue({ isMobile: true });
    render(<NavProjects projects={projects} />);
    expect(screen.getByText('Design Engineering')).toBeInTheDocument();
  });
});
