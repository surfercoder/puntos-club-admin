import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavUser } from '@/components/nav-user';

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="avatar" {...props}>{children}</div>
  ),
  AvatarFallback: ({ children }: React.PropsWithChildren) => (
    <span data-testid="avatar-fallback">{children}</span>
  ),
  AvatarImage: ({ alt }: { alt: string }) =>
    React.createElement('img', { 'data-testid': 'avatar-image', alt }),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SidebarMenuButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  useSidebar: jest.fn(() => ({ isMobile: false })),
}));

describe('NavUser', () => {
  const user = {
    name: 'John Doe',
    email: 'john@test.com',
    avatar: 'https://example.com/avatar.jpg',
  };

  it('renders user name and email', () => {
    render(<NavUser user={user} />);
    // Name and email appear twice (trigger and dropdown content)
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('john@test.com').length).toBeGreaterThanOrEqual(1);
  });

  it('renders user initials in avatar fallback', () => {
    render(<NavUser user={user} />);
    const fallbacks = screen.getAllByTestId('avatar-fallback');
    expect(fallbacks[0]).toHaveTextContent('JD');
  });

  it('renders avatar image when avatar URL is provided', () => {
    render(<NavUser user={user} />);
    expect(screen.getAllByTestId('avatar-image').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render avatar image when no avatar URL', () => {
    render(<NavUser user={{ name: 'John Doe', email: 'john@test.com' }} />);
    expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
  });

  it('renders profile link', () => {
    render(<NavUser user={user} />);
    expect(screen.getByRole('link', { name: /profile/ })).toHaveAttribute('href', '/dashboard/profile');
  });

  it('calls onLogout when logout is clicked', () => {
    const onLogout = jest.fn();
    render(<NavUser user={user} onLogout={onLogout} />);

    fireEvent.click(screen.getByText('logout'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders single letter fallback for single-word name', () => {
    render(<NavUser user={{ name: 'Admin', email: 'admin@test.com' }} />);
    const fallbacks = screen.getAllByTestId('avatar-fallback');
    expect(fallbacks[0]).toHaveTextContent('A');
  });

  it('renders with isMobile true (covers mobile branch)', () => {
    const { useSidebar } = require('@/components/ui/sidebar');
    (useSidebar as jest.Mock).mockReturnValue({ isMobile: true });
    render(<NavUser user={user} />);
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "U" fallback when name is empty', () => {
    render(<NavUser user={{ name: '', email: 'test@test.com' }} />);
    const fallbacks = screen.getAllByTestId('avatar-fallback');
    expect(fallbacks[0]).toHaveTextContent('U');
  });
});
