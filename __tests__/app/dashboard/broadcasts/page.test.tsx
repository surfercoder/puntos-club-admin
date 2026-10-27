import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';

import PlatformBroadcastsPage from '@/app/dashboard/broadcasts/page';

const mockUser = jest.fn();
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: () => mockUser() }));

const mockFrom = jest.fn();
jest.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: mockFrom }) }));

jest.mock('@/components/dashboard/platform/broadcast-form', () => ({
  BroadcastForm: ({ deviceCount }: { deviceCount: number }) => <div data-testid="form">{deviceCount}</div>,
}));

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order']) c[m] = jest.fn(() => c);
  c.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
  return c;
}

describe('PlatformBroadcastsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notFound as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  it('no existe para owners', async () => {
    mockUser.mockResolvedValue({ role: { name: 'owner' } });
    await expect(PlatformBroadcastsPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('muestra el formulario con la cantidad de dispositivos y el historial', async () => {
    mockUser.mockResolvedValue({ role: { name: 'admin' } });
    mockFrom
      .mockReturnValueOnce(chain({ count: 76 }))
      .mockReturnValueOnce(chain({
        data: [{ id: 1, title: 'Nueva versión', body: 'Actualizá', sent_count: 70, failed_count: 6, created_at: '2026-10-27T12:00:00Z' }],
      }));

    render(await PlatformBroadcastsPage());

    expect(screen.getByTestId('form')).toHaveTextContent('76');
    expect(screen.getByText('Nueva versión')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('historial vacio y sin conteo', async () => {
    mockUser.mockResolvedValue({ role: { name: 'admin' } });
    mockFrom.mockReturnValueOnce(chain({ count: null })).mockReturnValueOnce(chain({ data: [] }));
    render(await PlatformBroadcastsPage());
    expect(screen.getByTestId('form')).toHaveTextContent('0');
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('historial nulo', async () => {
    mockUser.mockResolvedValue({ role: { name: 'admin' } });
    mockFrom.mockReturnValueOnce(chain({ count: 1 })).mockReturnValueOnce(chain({ data: null }));
    render(await PlatformBroadcastsPage());
    expect(screen.getByText('empty')).toBeInTheDocument();
  });
});
