import React from 'react';
import { render, screen } from '@testing-library/react';
import { toast } from 'sonner';

import { MessageComposer } from '@/components/dashboard/platform/message-composer';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/actions/dashboard/platform/actions', () => ({ sendPlatformMessageAction: jest.fn() }));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(() => [{ status: '', message: '', fieldErrors: {} }, jest.fn(), false]),
}));

const setState = (state: object, pending = false) =>
  (React.useActionState as jest.Mock).mockReturnValue([{ status: '', message: '', fieldErrors: {}, ...state }, jest.fn(), pending]);

describe('MessageComposer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('responde en el hilo de una org con campo oculto', () => {
    setState({});
    const { container } = render(<MessageComposer organizationId={4} />);
    expect(container.querySelector('input[name="organization_id"]')).toHaveValue('4');
    expect(screen.queryByLabelText('toLabel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'send' })).toBeEnabled();
  });

  it('el superadmin elige destinatario, incluida "todas"', () => {
    setState({}, true);
    render(<MessageComposer organizations={[{ id: 1, name: 'One' }]} />);
    expect(screen.getByRole('option', { name: 'toAll' })).toHaveValue('all');
    expect(screen.getByRole('option', { name: 'One' })).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'sending' })).toBeDisabled();
  });

  it('avisa el exito y limpia el form', () => {
    setState({ status: 'success', message: 'ok' });
    const reset = jest.spyOn(HTMLFormElement.prototype, 'reset');
    render(<MessageComposer organizationId={4} />);
    expect(toast.success).toHaveBeenCalledWith('ok');
    expect(reset).toHaveBeenCalled();
  });

  it('avisa el error y muestra el error de campo', () => {
    setState({ status: 'error', message: 'mal', fieldErrors: { body: ['bodyRequired'] } });
    render(<MessageComposer organizationId={4} />);
    expect(toast.error).toHaveBeenCalledWith('mal');
    expect(screen.getByText('bodyRequired')).toBeInTheDocument();
  });

  it('un error solo de campo no tira toast', () => {
    setState({ status: 'error', message: '', fieldErrors: { body: ['bodyRequired'] } });
    render(<MessageComposer organizationId={4} />);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
