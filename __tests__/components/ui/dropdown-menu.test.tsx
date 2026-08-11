import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

beforeAll(() => {
  // Radix menus probe these; jsdom ships neither.
  Element.prototype.hasPointerCapture = jest.fn(() => false);
  Element.prototype.releasePointerCapture = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
});

describe('DropdownMenu', () => {
  it('opens from its trigger and runs the selected item', async () => {
    const onSelect = jest.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Compra</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={onSelect}>
              Editar
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('⌘E')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: /Editar/ }));
    expect(onSelect).toHaveBeenCalled();
  });

  it('marks destructive and inset items through data attributes', () => {
    const { baseElement } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset>Zona peligrosa</DropdownMenuLabel>
          <DropdownMenuItem inset variant="destructive">
            Eliminar
          </DropdownMenuItem>
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toHaveAttribute('data-inset', 'true');
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveAttribute('data-variant', 'default');
    expect(baseElement.querySelector('[data-slot="dropdown-menu-label"]')).toHaveAttribute('data-inset', 'true');
  });

  it('toggles a checkbox item and reports the new state', async () => {
    const onCheckedChange = jest.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
            Mostrar inactivos
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Mostrar activos</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole('menuitemcheckbox', { name: 'Mostrar activos' })).toHaveAttribute(
      'data-state',
      'checked',
    );

    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Mostrar inactivos' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('selects a radio item and reports the new value', async () => {
    const onValueChange = jest.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="asc" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="asc">Ascendente</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc">Descendente</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole('menuitemradio', { name: 'Ascendente' })).toHaveAttribute('data-state', 'checked');

    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Descendente' }));
    expect(onValueChange).toHaveBeenCalledWith('desc');
  });

  it('renders a submenu behind its trigger', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Exportar</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>CSV</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const subTrigger = screen.getByRole('menuitem', { name: 'Exportar' });
    expect(subTrigger).toHaveAttribute('data-inset', 'true');
    expect(screen.queryByRole('menuitem', { name: 'CSV' })).not.toBeInTheDocument();

    await userEvent.click(subTrigger);
    expect(await screen.findByRole('menuitem', { name: 'CSV' })).toBeInTheDocument();
  });

  it('merges custom classNames into every part', () => {
    const { baseElement } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuLabel className="custom-label">l</DropdownMenuLabel>
          <DropdownMenuSeparator className="custom-separator" />
          <DropdownMenuItem className="custom-item">i</DropdownMenuItem>
          <DropdownMenuCheckboxItem className="custom-checkbox">c</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem className="custom-radio" value="a">
              r
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuShortcut className="custom-shortcut">s</DropdownMenuShortcut>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="custom-sub-trigger">st</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="custom-sub-content">sc</DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    for (const cls of [
      'custom-content',
      'custom-label',
      'custom-separator',
      'custom-item',
      'custom-checkbox',
      'custom-radio',
      'custom-shortcut',
      'custom-sub-trigger',
    ]) {
      expect(baseElement.querySelector(`.${cls}`)).toBeInTheDocument();
    }
  });
});
