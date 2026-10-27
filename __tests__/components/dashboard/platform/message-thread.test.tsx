import { render, screen } from '@testing-library/react';

import { MessageThread } from '@/components/dashboard/platform/message-thread';
import type { PlatformMessage } from '@/types/platform';

const base = { organization_id: 1, sender_id: 1, read_at: null, created_at: '2026-10-27T12:00:00Z' };
const messages: PlatformMessage[] = [
  { ...base, id: 1, from_platform: true, body: 'Hola desde la plataforma' },
  { ...base, id: 2, from_platform: false, body: 'Respuesta', sender: { first_name: 'Ana', last_name: null } },
  { ...base, id: 3, from_platform: false, body: 'Anonima', sender: null },
];

describe('MessageThread', () => {
  it('vacio', async () => {
    render(await MessageThread({ messages: [], viewerIsPlatform: true }));
    expect(screen.getByText('emptyThread')).toBeInTheDocument();
  });

  it('lo propio va a la derecha y cada mensaje lleva su autor', async () => {
    render(await MessageThread({ messages, viewerIsPlatform: true }));
    expect(screen.getByText('Hola desde la plataforma').closest('li')).toHaveClass('self-end');
    expect(screen.getByText('Respuesta').closest('li')).toHaveClass('self-start');
    expect(screen.getByText(/^platformName ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Ana ·/)).toBeInTheDocument();
    expect(screen.getByText(/^orgTeam ·/)).toBeInTheDocument();
  });

  it('desde la org, lo de la org es lo propio', async () => {
    render(await MessageThread({ messages, viewerIsPlatform: false }));
    expect(screen.getByText('Respuesta').closest('li')).toHaveClass('self-end');
  });
});
