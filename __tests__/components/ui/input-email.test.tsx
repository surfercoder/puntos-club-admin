import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input type="email"', () => {
  it('entrega el valor en minuscula al onChange', () => {
    const onChange = jest.fn();
    render(<Input aria-label="email" onChange={onChange} type="email" />);

    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'Fede@Owner.COM' },
    });

    expect(onChange.mock.calls[0][0].target.value).toBe('fede@owner.com');
  });

  it('pide el teclado de email y no autocapitaliza', () => {
    render(<Input aria-label="email" type="email" />);
    const input = screen.getByLabelText('email');

    expect(input).toHaveAttribute('inputmode', 'email');
    expect(input).toHaveAttribute('autocapitalize', 'none');
  });

  it('no toca los inputs de texto', () => {
    const onChange = jest.fn();
    render(<Input aria-label="nombre" onChange={onChange} type="text" />);

    fireEvent.change(screen.getByLabelText('nombre'), {
      target: { value: 'Fede' },
    });

    expect(onChange.mock.calls[0][0].target.value).toBe('Fede');
  });
});
