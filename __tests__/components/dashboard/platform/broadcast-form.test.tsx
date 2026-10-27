import React from 'react';
import { render, screen } from '@testing-library/react';
import { toast } from 'sonner';

import { BroadcastForm } from '@/components/dashboard/platform/broadcast-form';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/actions/dashboard/platform/actions', () => ({ sendPlatformBroadcastAction: jest.fn() }));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: jest.fn(() => [{ status: '', message: '', fieldErrors: {} }, jest.fn(), false]),
}));

const setState = (state: object, pending = false) =>
  (React.useActionState as jest.Mock).mockReturnValue([{ status: '', message: '', fieldErrors: {}, ...state }, jest.fn(), pending]);

describe('BroadcastForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pide confirmar antes de mandar a todos', () => {
    setState({});
    render(<BroadcastForm deviceCount={76} />);
    expect(screen.getByRole('checkbox')).toBeRequired();
    expect(screen.getByLabelText('titleLabel')).toHaveAttribute('maxLength', '65');
    expect(screen.getByLabelText('bodyLabel')).toHaveAttribute('maxLength', '240');
    expect(screen.getByRole('button', { name: 'send' })).toBeEnabled();
  });

  it('deshabilita el boton mientras manda', () => {
    setState({}, true);
    render(<BroadcastForm deviceCount={0} />);
    expect(screen.getByRole('button', { name: 'sending' })).toBeDisabled();
  });

  it('avisa el resultado y limpia el form', () => {
    setState({ status: 'success', message: 'enviado' });
    const reset = jest.spyOn(HTMLFormElement.prototype, 'reset');
    render(<BroadcastForm deviceCount={1} />);
    expect(toast.success).toHaveBeenCalledWith('enviado');
    expect(reset).toHaveBeenCalled();
  });

  it('avisa el error del servidor', () => {
    setState({ status: 'error', message: 'mal', fieldErrors: { title: ['titleRequired'] } });
    render(<BroadcastForm deviceCount={1} />);
    expect(toast.error).toHaveBeenCalledWith('mal');
    expect(screen.getByText('titleRequired')).toBeInTheDocument();
  });

  it('un error solo de campo no tira toast', () => {
    setState({ status: 'error', message: '' });
    render(<BroadcastForm deviceCount={1} />);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
