jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: jest.fn(() => false) }));

import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const mockIsMobile = (value: boolean) => (useIsMobile as jest.Mock).mockReturnValue(value);

const withProvider = (ui: React.ReactNode, props: React.ComponentProps<typeof SidebarProvider> = {}) =>
  render(<SidebarProvider {...props}>{ui}</SidebarProvider>);

beforeEach(() => {
  mockIsMobile(false);
  document.cookie = 'sidebar_state=; path=/; max-age=0';
});

describe('useSidebar', () => {
  it('refuses to run outside a SidebarProvider', () => {
    // React logs the thrown error; silence it so the run stays readable.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSidebar())).toThrow('useSidebar must be used within a SidebarProvider.');
    spy.mockRestore();
  });

  it('reports the expanded state and flips it through toggleSidebar', async () => {
    const { result } = renderHook(() => useSidebar(), { wrapper: SidebarProvider });

    expect(result.current.state).toBe('expanded');
    expect(result.current.open).toBe(true);

    await userEvent.keyboard('{Meta>}b{/Meta}');
    expect(result.current.state).toBe('collapsed');
    expect(result.current.open).toBe(false);
  });
});

describe('SidebarProvider', () => {
  it('persists the open state to a cookie', async () => {
    withProvider(<SidebarTrigger />);

    await userEvent.click(screen.getByRole('button'));
    expect(document.cookie).toContain('sidebar_state=false');

    await userEvent.click(screen.getByRole('button'));
    expect(document.cookie).toContain('sidebar_state=true');
  });

  it('hands control to onOpenChange when open is supplied', async () => {
    const onOpenChange = jest.fn();
    withProvider(<SidebarTrigger />, { open: true, onOpenChange });

    await userEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('accepts a plain boolean through setOpen, not just an updater', async () => {
    const { result } = renderHook(() => useSidebar(), { wrapper: SidebarProvider });

    await act(async () => result.current.setOpen(false));
    expect(result.current.state).toBe('collapsed');
    expect(document.cookie).toContain('sidebar_state=false');
  });

  it('starts collapsed when defaultOpen is false', () => {
    withProvider(<Sidebar>menu</Sidebar>, { defaultOpen: false });
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-state', 'collapsed');
  });

  it('toggles with ctrl+b as well as cmd+b, and ignores a bare b', async () => {
    const { result } = renderHook(() => useSidebar(), { wrapper: SidebarProvider });

    await userEvent.keyboard('b');
    expect(result.current.open).toBe(true);

    await userEvent.keyboard('{Control>}b{/Control}');
    expect(result.current.open).toBe(false);
  });

  it('toggles the mobile drawer instead of the desktop rail on small screens', async () => {
    mockIsMobile(true);
    const { result } = renderHook(() => useSidebar(), { wrapper: SidebarProvider });

    expect(result.current.openMobile).toBe(false);
    await userEvent.keyboard('{Meta>}b{/Meta}');
    expect(result.current.openMobile).toBe(true);
    // the desktop state is left untouched
    expect(result.current.open).toBe(true);
  });

  it('merges a custom className and style onto the wrapper', () => {
    const { container } = render(
      <SidebarProvider className="custom" style={{ '--extra': '1px' } as React.CSSProperties}>
        x
      </SidebarProvider>,
    );
    const wrapper = container.querySelector('[data-slot="sidebar-wrapper"]');
    expect(wrapper).toHaveClass('custom');
    expect(wrapper).toHaveStyle({ '--sidebar-width': '16rem', '--extra': '1px' });
  });
});

describe('Sidebar', () => {
  it('renders a plain column when collapsible is none', () => {
    withProvider(
      <Sidebar className="custom" collapsible="none">
        contenido
      </Sidebar>,
    );
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toHaveClass('custom');
    expect(sidebar).not.toHaveAttribute('data-state');
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('renders inside a sheet on mobile', () => {
    mockIsMobile(true);
    const { result } = renderHook(() => useSidebar(), { wrapper: SidebarProvider });

    render(
      <SidebarProvider>
        <Sidebar>contenido móvil</Sidebar>
      </SidebarProvider>,
    );
    expect(result.current.isMobile).toBe(true);
    // closed by default, so the sheet content is not mounted yet
    expect(screen.queryByText('contenido móvil')).not.toBeInTheDocument();
  });

  it('mounts the mobile sheet content once opened', async () => {
    mockIsMobile(true);
    withProvider(
      <>
        <SidebarTrigger />
        <Sidebar>contenido móvil</Sidebar>
      </>,
    );

    await userEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('contenido móvil')).toBeInTheDocument();
  });

  it.each(['left', 'right'] as const)('anchors to the %s side on desktop', (side) => {
    withProvider(<Sidebar side={side}>contenido</Sidebar>);
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-side', side);
  });

  it.each(['sidebar', 'floating', 'inset'] as const)('renders the %s variant', (variant) => {
    withProvider(<Sidebar variant={variant}>contenido</Sidebar>);
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-variant', variant);
  });

  it('exposes the collapsible mode only while collapsed', () => {
    const { unmount } = render(
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">contenido</Sidebar>
      </SidebarProvider>,
    );
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-collapsible', '');
    unmount();

    render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon">contenido</Sidebar>
      </SidebarProvider>,
    );
    expect(document.querySelector('[data-slot="sidebar"]')).toHaveAttribute('data-collapsible', 'icon');
  });
});

describe('SidebarTrigger and SidebarRail', () => {
  it('runs the caller onClick before toggling', async () => {
    const onClick = jest.fn();
    withProvider(<SidebarTrigger className="custom" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
    expect(document.cookie).toContain('sidebar_state=false');
  });

  it('toggles from the rail', async () => {
    withProvider(<SidebarRail className="custom" />);

    const rail = document.querySelector('[data-slot="sidebar-rail"]') as HTMLElement;
    expect(rail).toHaveClass('custom');
    expect(rail).toHaveAttribute('aria-label', 'toggleSidebar');

    await userEvent.click(rail);
    expect(document.cookie).toContain('sidebar_state=false');
  });
});

describe('Sidebar layout parts', () => {
  it('renders each structural part with its slot and a merged className', () => {
    withProvider(
      <SidebarInset className="custom-inset">
        <SidebarHeader className="custom-header">
          <SidebarInput className="custom-input" placeholder="Buscar" />
        </SidebarHeader>
        <SidebarContent className="custom-content">
          <SidebarGroup className="custom-group">
            <SidebarGroupLabel className="custom-group-label">Sección</SidebarGroupLabel>
            <SidebarGroupAction className="custom-group-action">+</SidebarGroupAction>
            <SidebarGroupContent className="custom-group-content">
              <SidebarMenu className="custom-menu">
                <SidebarMenuItem className="custom-menu-item">
                  <SidebarMenuButton className="custom-menu-button">Compras</SidebarMenuButton>
                  <SidebarMenuAction className="custom-menu-action">…</SidebarMenuAction>
                  <SidebarMenuBadge className="custom-menu-badge">3</SidebarMenuBadge>
                  <SidebarMenuSub className="custom-menu-sub">
                    <SidebarMenuSubItem className="custom-menu-sub-item">
                      <SidebarMenuSubButton className="custom-menu-sub-button" href="/x">
                        Detalle
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator className="custom-separator" />
        <SidebarFooter className="custom-footer">pie</SidebarFooter>
      </SidebarInset>,
    );

    for (const slot of [
      'sidebar-inset',
      'sidebar-header',
      'sidebar-input',
      'sidebar-content',
      'sidebar-group',
      'sidebar-group-label',
      'sidebar-group-action',
      'sidebar-group-content',
      'sidebar-menu',
      'sidebar-menu-item',
      'sidebar-menu-button',
      'sidebar-menu-action',
      'sidebar-menu-badge',
      'sidebar-menu-sub',
      'sidebar-menu-sub-item',
      'sidebar-menu-sub-button',
      'sidebar-separator',
      'sidebar-footer',
    ]) {
      const element = document.querySelector(`[data-slot="${slot}"]`);
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass(`custom-${slot.replace('sidebar-', '')}`);
    }
  });

  it('renders group label and action as their child element when asChild is set', () => {
    withProvider(
      <>
        <SidebarGroupLabel asChild>
          <h2>Sección</h2>
        </SidebarGroupLabel>
        <SidebarGroupAction asChild>
          <a href="/nuevo">Nuevo</a>
        </SidebarGroupAction>
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Sección' })).toHaveAttribute(
      'data-slot',
      'sidebar-group-label',
    );
    expect(screen.getByRole('link', { name: 'Nuevo' })).toHaveAttribute(
      'data-slot',
      'sidebar-group-action',
    );
  });
});

describe('SidebarMenuButton', () => {
  it('defaults to the default variant and size and reports inactive', () => {
    withProvider(<SidebarMenuButton>Compras</SidebarMenuButton>);
    const button = screen.getByRole('button', { name: 'Compras' });
    expect(button).toHaveAttribute('data-size', 'default');
    expect(button).toHaveAttribute('data-active', 'false');
  });

  it.each(['sm', 'lg'] as const)('honors the %s size', (size) => {
    withProvider(<SidebarMenuButton size={size}>Compras</SidebarMenuButton>);
    expect(screen.getByRole('button', { name: 'Compras' })).toHaveAttribute('data-size', size);
  });

  it('marks the active entry and applies the outline variant', () => {
    withProvider(
      <SidebarMenuButton isActive variant="outline">
        Compras
      </SidebarMenuButton>,
    );
    const button = screen.getByRole('button', { name: 'Compras' });
    expect(button).toHaveAttribute('data-active', 'true');
    expect(button).toHaveClass('bg-background');
  });

  it('renders as its child element when asChild is set', () => {
    withProvider(
      <SidebarMenuButton asChild>
        <a href="/compras">Compras</a>
      </SidebarMenuButton>,
    );
    expect(screen.getByRole('link', { name: 'Compras' })).toHaveAttribute(
      'data-slot',
      'sidebar-menu-button',
    );
  });

  it('wraps the button in a tooltip when given a string label', async () => {
    withProvider(<SidebarMenuButton tooltip="Ir a compras">Compras</SidebarMenuButton>, {
      defaultOpen: false,
    });

    await userEvent.hover(screen.getByRole('button', { name: 'Compras' }));
    expect(await screen.findAllByText('Ir a compras')).not.toHaveLength(0);
  });

  it('accepts tooltip props as an object', async () => {
    withProvider(
      <SidebarMenuButton tooltip={{ children: 'Ir a compras', side: 'left' }}>Compras</SidebarMenuButton>,
      { defaultOpen: false },
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Compras' }));
    expect(await screen.findAllByText('Ir a compras')).not.toHaveLength(0);
  });

  it('hides the tooltip while the sidebar is expanded', async () => {
    withProvider(<SidebarMenuButton tooltip="Ir a compras">Compras</SidebarMenuButton>);

    await userEvent.hover(screen.getByRole('button', { name: 'Compras' }));
    const tooltip = document.querySelector('[data-slot="tooltip-content"]');
    expect(tooltip === null || tooltip.hasAttribute('hidden')).toBe(true);
  });
});

describe('SidebarMenuAction, SidebarMenuSubButton and SidebarMenuSkeleton', () => {
  it('reveals the action on hover only when asked', () => {
    const { rerender } = render(
      <SidebarProvider>
        <SidebarMenuAction>…</SidebarMenuAction>
      </SidebarProvider>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-action"]')).not.toHaveClass('md:opacity-0');

    rerender(
      <SidebarProvider>
        <SidebarMenuAction showOnHover>…</SidebarMenuAction>
      </SidebarProvider>,
    );
    expect(document.querySelector('[data-slot="sidebar-menu-action"]')).toHaveClass('md:opacity-0');
  });

  it('renders the action as its child element when asChild is set', () => {
    withProvider(
      <SidebarMenuAction asChild>
        <a href="/x">…</a>
      </SidebarMenuAction>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('data-slot', 'sidebar-menu-action');
  });

  it.each([
    ['sm', 'text-xs'],
    ['md', 'text-sm'],
  ] as const)('sizes the sub button as %s', (size, expectedClass) => {
    withProvider(
      <SidebarMenuSubButton href="/x" size={size}>
        Detalle
      </SidebarMenuSubButton>,
    );
    const link = screen.getByRole('link', { name: 'Detalle' });
    expect(link).toHaveAttribute('data-size', size);
    expect(link).toHaveClass(expectedClass);
  });

  it('marks the active sub button and renders it as a child element when asChild is set', () => {
    withProvider(
      <SidebarMenuSubButton asChild isActive>
        <button type="button">Detalle</button>
      </SidebarMenuSubButton>,
    );
    const button = screen.getByRole('button', { name: 'Detalle' });
    expect(button).toHaveAttribute('data-active', 'true');
    expect(button).toHaveAttribute('data-slot', 'sidebar-menu-sub-button');
  });

  it('renders the skeleton icon only when asked', () => {
    const { rerender } = render(
      <SidebarProvider>
        <SidebarMenuSkeleton />
      </SidebarProvider>,
    );
    expect(document.querySelector('[data-sidebar="menu-skeleton-icon"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-sidebar="menu-skeleton-text"]')).toBeInTheDocument();

    rerender(
      <SidebarProvider>
        <SidebarMenuSkeleton showIcon />
      </SidebarProvider>,
    );
    expect(document.querySelector('[data-sidebar="menu-skeleton-icon"]')).toBeInTheDocument();
  });
});
