import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { NotificationBell } from '@/components/notification-bell';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

type Result = { data?: unknown; count?: number | null };

function chain(result: Result) {
  const c: Record<string, jest.Mock | unknown> = {};
  for (const m of ['select', 'eq', 'is', 'order', 'limit']) c[m] = jest.fn(() => c);
  c.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return c as Record<string, jest.Mock>;
}

function mockSupabase(list: Result, count: Result) {
  const listChain = chain(list);
  const countChain = chain(count);
  const from = jest.fn().mockReturnValueOnce(listChain).mockReturnValueOnce(countChain);
  (createClient as jest.Mock).mockReturnValue({ from });
  return { listChain, countChain };
}

describe('NotificationBell', () => {
  it('al owner le muestra los mensajes del superadmin de su org activa', async () => {
    const { listChain, countChain } = mockSupabase(
      { data: [{ id: 1, organization_id: 5, body: 'Hola equipo', read_at: null, organization: { name: 'One' } }] },
      { count: 12 },
    );

    render(<NotificationBell activeOrgId="5" isPlatform={false} />);

    expect(await screen.findByText('Hola equipo')).toBeInTheDocument();
    expect(screen.getByText('9+')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ariaUnread' })).toBeInTheDocument();
    expect(screen.getByText('platformName')).toHaveClass('font-semibold');
    expect(screen.getByText('Hola equipo').closest('a')).toHaveAttribute('href', '/dashboard/messages');
    expect(listChain.eq).toHaveBeenCalledWith('from_platform', true);
    expect(listChain.eq).toHaveBeenCalledWith('organization_id', 5);
    expect(countChain.eq).toHaveBeenCalledWith('organization_id', 5);
  });

  it('al superadmin le muestra las respuestas y linkea al hilo de cada org', async () => {
    const { listChain } = mockSupabase(
      {
        data: [
          { id: 2, organization_id: 8, body: 'Gracias', read_at: '2026-10-27', organization: [{ name: 'Rueda' }] },
          { id: 3, organization_id: 9, body: 'Sin org', read_at: null, organization: null },
        ],
      },
      { count: 3 },
    );

    render(<NotificationBell activeOrgId={null} isPlatform />);

    expect(await screen.findByText('Rueda')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Gracias').closest('a')).toHaveAttribute('href', '/dashboard/messages?org=8');
    expect(listChain.eq).toHaveBeenCalledWith('from_platform', false);
    expect(listChain.eq).not.toHaveBeenCalledWith('organization_id', expect.anything());
  });

  it('sin mensajes muestra el vacio y no pinta badge', async () => {
    mockSupabase({ data: null }, { count: null });
    render(<NotificationBell activeOrgId={null} isPlatform={false} />);
    expect(await screen.findByText('empty')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'aria' })).toBeInTheDocument();
  });

  it('ignora la respuesta si se desmonto antes', async () => {
    const { listChain } = mockSupabase({ data: [] }, { count: 1 });
    const { unmount } = render(<NotificationBell activeOrgId={null} isPlatform />);
    unmount();
    await waitFor(() => expect(listChain.limit).toHaveBeenCalled());
  });
});
