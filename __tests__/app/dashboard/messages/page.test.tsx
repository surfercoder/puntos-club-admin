import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';

import PlatformMessagesPage from '@/app/dashboard/messages/page';

const mockUser = jest.fn();
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: () => mockUser() }));

const mockActiveOrg = jest.fn();
jest.mock('@/lib/auth/get-active-org-id', () => ({ getActiveOrgIdFilter: () => mockActiveOrg() }));

const mockMarkRead = jest.fn();
jest.mock('@/actions/dashboard/platform/actions', () => ({
  markPlatformMessagesRead: (...a: unknown[]) => mockMarkRead(...a),
}));

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: mockFrom }) }));

jest.mock('@/components/dashboard/platform/message-composer', () => ({
  MessageComposer: (props: { organizationId?: number; organizations?: { name: string }[] }) => (
    <div data-testid="composer">
      {props.organizationId ?? ''}|{props.organizations?.map((o) => o.name).join(',')}
    </div>
  ),
}));
jest.mock('@/components/dashboard/platform/platform-inbox', () => ({
  PlatformInbox: () => <div data-testid="inbox" />,
}));
jest.mock('@/components/dashboard/platform/message-thread', () => ({
  MessageThread: (props: { messages: { body: string }[]; viewerIsPlatform: boolean }) => (
    <div data-testid="thread">{props.messages.map((m) => m.body).join(',')}|{String(props.viewerIsPlatform)}</div>
  ),
}));

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit', 'maybeSingle']) c[m] = jest.fn(() => c);
  c.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return c;
}

const admin = { id: '18', role: { name: 'admin' } };
const owner = { id: '7', role: { name: 'owner' } };
const page = (org?: string) => PlatformMessagesPage({ searchParams: Promise.resolve(org ? { org } : {}) });

describe('PlatformMessagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notFound as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  it('sin usuario no existe', async () => {
    mockUser.mockResolvedValue(null);
    await expect(page()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('el superadmin sin org elegida ve la bandeja', async () => {
    mockUser.mockResolvedValue(admin);
    render(await page('abc'));
    expect(screen.getByText('adminTitle')).toBeInTheDocument();
    expect(screen.getByTestId('inbox')).toBeInTheDocument();
    expect(mockMarkRead).not.toHaveBeenCalled();
  });

  it('hilo de una org desde el superadmin: marca leido y vuelve a la bandeja', async () => {
    mockUser.mockResolvedValue(admin);
    mockFrom
      .mockReturnValueOnce(chain({ data: [{ body: 'hola' }] }))
      .mockReturnValueOnce(chain({ data: { name: 'One' } }));

    render(await page('5'));

    expect(mockMarkRead).toHaveBeenCalledWith(5);
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText(/backToInbox/).closest('a')).toHaveAttribute('href', '/dashboard/messages');
    expect(screen.getByTestId('thread')).toHaveTextContent('hola|true');
    expect(screen.getByTestId('composer')).toHaveTextContent('5|');
  });

  it('hilo de una org que no se encuentra', async () => {
    mockUser.mockResolvedValue(admin);
    mockFrom.mockReturnValueOnce(chain({ data: null })).mockReturnValueOnce(chain({ data: null }));
    render(await page('9'));
    expect(screen.getByText('#9')).toBeInTheDocument();
    expect(screen.getByTestId('thread')).toHaveTextContent('|true');
  });

  it('el owner ve el hilo de su org activa, sin bandeja', async () => {
    mockUser.mockResolvedValue(owner);
    mockActiveOrg.mockResolvedValue(4);
    mockFrom.mockReturnValueOnce(chain({ data: [{ body: 'aviso' }] })).mockReturnValueOnce(chain({ data: { name: 'One' } }));

    render(await page('99'));

    expect(screen.getByText('ownerTitle')).toBeInTheDocument();
    expect(mockMarkRead).toHaveBeenCalledWith(4);
    expect(screen.queryByText(/backToInbox/)).not.toBeInTheDocument();
    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(screen.getByTestId('thread')).toHaveTextContent('aviso|false');
  });

  it('el owner sin org activa', async () => {
    mockUser.mockResolvedValue(owner);
    mockActiveOrg.mockResolvedValue(null);
    render(await page());
    expect(screen.getByText('noOrganization')).toBeInTheDocument();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
