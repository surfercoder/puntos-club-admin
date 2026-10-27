import { render, screen } from '@testing-library/react';

import { PlatformInbox } from '@/components/dashboard/platform/platform-inbox';

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: mockFrom }) }));

jest.mock('@/components/dashboard/platform/message-composer', () => ({
  MessageComposer: (props: { organizations: { name: string }[] }) => (
    <div data-testid="composer">{props.organizations.map((o) => o.name).join(',')}</div>
  ),
}));

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'order', 'limit']) c[m] = jest.fn(() => c);
  c.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return c;
}

const msg = (over: object) => ({
  id: 1, organization_id: 1, body: 'x', from_platform: false, read_at: null, created_at: '2026-10-27T12:00:00Z', organization: { name: 'One' }, ...over,
});

describe('PlatformInbox', () => {
  beforeEach(() => mockFrom.mockReset());

  it('agrupa por org, muestra el ultimo mensaje y cuenta no leidos', async () => {
    mockFrom
      .mockReturnValueOnce(chain({
        data: [
          msg({ id: 3, organization_id: 1, body: 'ultima de One' }),
          msg({ id: 2, organization_id: 1, body: 'vieja', read_at: '2026-10-27' }),
          msg({ id: 1, organization_id: 1, body: 'otra sin leer' }),
          msg({ id: 4, organization_id: 2, body: 'nuestro', from_platform: true, organization: [{ name: 'Two' }] }),
          msg({ id: 5, organization_id: 3, body: 'huerfano', organization: null }),
        ],
      }))
      .mockReturnValueOnce(chain({ data: [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }] }));

    render(await PlatformInbox());

    expect(screen.getByTestId('composer')).toHaveTextContent('One,Two');
    expect(screen.getByText('ultima de One').closest('a')).toHaveAttribute('href', '/dashboard/messages?org=1');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('you: nuestro')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.queryByText('vieja')).not.toBeInTheDocument();
  });

  it('bandeja vacia', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null })).mockReturnValueOnce(chain({ data: null }));
    render(await PlatformInbox());
    expect(screen.getByText('emptyInbox')).toBeInTheDocument();
    expect(screen.getByTestId('composer')).toHaveTextContent('');
  });
});
