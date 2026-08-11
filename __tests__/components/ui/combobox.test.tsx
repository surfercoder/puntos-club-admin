import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

import { Combobox } from '@/components/ui/combobox';

const options = [
  { value: '1', label: 'Carlos Schmidt' },
  { value: '2', label: 'Prueba Prueba' },
];

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const hiddenValue = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[name="beneficiary_id"]')?.value;

describe('Combobox', () => {
  it('submits defaultValue and shows its label', () => {
    const { container } = render(
      <Combobox defaultValue="2" name="beneficiary_id" options={options} placeholder="Seleccionar" />,
    );
    expect(hiddenValue(container)).toBe('2');
    // the form's <Label htmlFor={name}> targets the trigger, not the hidden input
    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'beneficiary_id');
    expect(screen.getByRole('combobox')).toHaveTextContent('Prueba Prueba');
  });

  it('filters by typed text and selecting updates the submitted value', () => {
    const onValueChange = jest.fn();
    const { container } = render(
      <Combobox name="beneficiary_id" options={options} placeholder="Seleccionar" onValueChange={onValueChange} />,
    );
    expect(hiddenValue(container)).toBe('');

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.change(screen.getByPlaceholderText('search'), { target: { value: 'carlos' } });

    expect(screen.getByText('Carlos Schmidt')).toBeInTheDocument();
    expect(screen.queryByText('Prueba Prueba')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Carlos Schmidt'));
    expect(hiddenValue(container)).toBe('1');
    expect(onValueChange).toHaveBeenCalledWith('1');
  });
});
