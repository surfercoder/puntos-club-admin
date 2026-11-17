import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClubiChat } from '@/components/clubi-chat';

const fetchMock = jest.fn();

const respond = (body: unknown, ok = true) => fetchMock.mockResolvedValueOnce({ ok, json: async () => body });
const sentMessages = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body).messages;

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  Element.prototype.scrollTo = jest.fn();
});

async function openChat() {
  const user = userEvent.setup();
  render(<ClubiChat />);
  await user.click(screen.getByRole('button', { name: 'open' }));
  return user;
}

describe('ClubiChat', () => {
  it('abre y cierra el panel (botón flotante y X)', async () => {
    const user = await openChat();
    expect(screen.getByRole('region', { name: 'Clubi' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'close' })[0]);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(screen.getAllByRole('button', { name: 'close' })[1]);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('una sugerencia pregunta y muestra la respuesta', async () => {
    respond({ reply: 'Hola!' });
    const user = await openChat();
    await user.click(screen.getByRole('button', { name: 'suggestion1' }));
    expect(await screen.findByText('Hola!')).toBeInTheDocument();
    expect(sentMessages(0)).toEqual([expect.objectContaining({ role: 'user', content: 'suggestion1' })]);
    expect(screen.queryByRole('button', { name: 'suggestion2' })).not.toBeInTheDocument();
  });

  it('los errores se muestran pero no viajan como historia', async () => {
    respond({ error: 'tope' }, false);
    fetchMock.mockRejectedValueOnce(new Error('red'));
    respond({}, false);
    respond({ reply: 'ok' });
    const user = await openChat();
    const input = screen.getByRole('textbox', { name: 'placeholder' });

    await user.type(input, 'uno{enter}');
    expect(await screen.findByText('⚠ tope')).toBeInTheDocument();
    await user.type(input, 'dos{enter}');
    expect(await screen.findByText('⚠ error')).toBeInTheDocument();
    await user.type(input, 'tres{enter}');
    await waitFor(() => expect(screen.getAllByText('⚠ error')).toHaveLength(2));
    await user.type(input, 'cuatro{enter}');
    expect(await screen.findByText('ok')).toBeInTheDocument();

    expect(sentMessages(3).map((m: { content: string }) => m.content)).toEqual(['uno', 'dos', 'tres', 'cuatro']);
  });

  it('no manda vacíos ni mientras espera', async () => {
    let resolve: (v: unknown) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const user = await openChat();
    const input = screen.getByRole('textbox', { name: 'placeholder' });
    await user.type(input, '   {enter}');
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(input, 'hola{enter}');
    expect(screen.getByText('thinking')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'send' })).toBeDisabled();
    await user.type(input, 'otra{enter}');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ reply: 'listo' }) });
    expect(await screen.findByText('listo')).toBeInTheDocument();
  });
});
