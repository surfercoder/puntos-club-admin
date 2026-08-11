import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

beforeAll(() => {
  // Radix Select probes these; jsdom ships neither.
  Element.prototype.hasPointerCapture = jest.fn(() => false);
  Element.prototype.releasePointerCapture = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
});

const renderSelect = (props: { position?: 'popper' | 'item-aligned'; onValueChange?: jest.Mock } = {}) =>
  render(
    <Select defaultOpen onValueChange={props.onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Elegí una sucursal" />
      </SelectTrigger>
      <SelectContent position={props.position}>
        <SelectGroup>
          <SelectLabel>Sucursales</SelectLabel>
          <SelectSeparator />
          <SelectItem value="1">Centro</SelectItem>
          <SelectItem value="2">Norte</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>,
  );

describe('Select', () => {
  it('shows the placeholder until a value is picked', async () => {
    const onValueChange = jest.fn();
    renderSelect({ onValueChange });

    expect(screen.getByText('Elegí una sucursal')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('option', { name: 'Norte' }));
    expect(onValueChange).toHaveBeenCalledWith('2');
    expect(screen.getByText('Norte')).toBeInTheDocument();
    expect(screen.queryByText('Elegí una sucursal')).not.toBeInTheDocument();
  });

  it('defaults the trigger to the medium size and honors sm', () => {
    const { rerender } = render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'default');

    rerender(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm');
  });

  it('adds popper offset classes only in popper position', () => {
    const { baseElement, unmount } = renderSelect({ position: 'popper' });
    expect(baseElement.querySelector('[data-slot="select-content"]')).toHaveClass(
      'data-[side=bottom]:translate-y-1',
    );
    unmount();

    const itemAligned = renderSelect({ position: 'item-aligned' });
    expect(itemAligned.baseElement.querySelector('[data-slot="select-content"]')).not.toHaveClass(
      'data-[side=bottom]:translate-y-1',
    );
  });

  it('renders the group label, separator and a check indicator for the selected item', () => {
    const { baseElement } = render(
      <Select defaultOpen defaultValue="1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sucursales</SelectLabel>
            <SelectSeparator />
            <SelectItem value="1">Centro</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    expect(baseElement.querySelector('[data-slot="select-label"]')).toHaveTextContent('Sucursales');
    expect(baseElement.querySelector('[data-slot="select-separator"]')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Centro' })).toHaveAttribute('data-state', 'checked');
    expect(baseElement.querySelector('[data-slot="select-item-indicator"]')).toBeInTheDocument();
  });

  it('merges custom classNames into the trigger, content and item', () => {
    const { baseElement } = render(
      <Select defaultOpen>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem className="custom-item" value="1">
            Centro
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    // asserting a base class alongside the custom one catches cn() dropping the defaults;
    // an open Select hides the trigger from the a11y tree, so query it by slot
    expect(baseElement.querySelector('[data-slot="select-trigger"]')).toHaveClass('custom-trigger', 'rounded-md');
    expect(baseElement.querySelector('[data-slot="select-content"]')).toHaveClass('custom-content', 'rounded-md');
    expect(screen.getByRole('option', { name: 'Centro' })).toHaveClass('custom-item', 'rounded-sm');
  });
});
