import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

describe('Sheet', () => {
  it('opens from its trigger and renders title, description and body', async () => {
    render(
      <Sheet>
        <SheetTrigger>Abrir menú</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Navegación</SheetTitle>
            <SheetDescription>Elegí una sección</SheetDescription>
          </SheetHeader>
          <SheetFooter>Pie</SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Navegación')).toBeInTheDocument();
    expect(screen.getByText('Elegí una sección')).toBeInTheDocument();
    expect(screen.getByText('Pie')).toBeInTheDocument();
  });

  it.each(['right', 'left', 'top', 'bottom'] as const)('anchors the panel to the %s side', (side) => {
    const { baseElement } = render(
      <Sheet defaultOpen>
        <SheetContent side={side}>
          <SheetTitle>t</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    const content = baseElement.querySelector('[data-slot="sheet-content"]');
    const anchorClass = {
      right: 'right-0',
      left: 'left-0',
      top: 'top-0',
      bottom: 'bottom-0',
    }[side];
    expect(content).toHaveClass(anchorClass);
  });

  it('defaults to the right side', () => {
    const { baseElement } = render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>t</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(baseElement.querySelector('[data-slot="sheet-content"]')).toHaveClass('right-0');
  });

  it('renders a close button by default and closes on click', async () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>t</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('omits the close button when showCloseButton is false', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent showCloseButton={false}>
          <SheetTitle>t</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.queryByRole('button', { name: 'close' })).not.toBeInTheDocument();
  });

  it('closes through an explicit SheetClose', async () => {
    render(
      <Sheet defaultOpen>
        <SheetContent showCloseButton={false}>
          <SheetTitle>t</SheetTitle>
          <SheetClose>Cancelar</SheetClose>
        </SheetContent>
      </Sheet>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('merges custom classNames into every part', () => {
    const { baseElement } = render(
      <Sheet defaultOpen>
        <SheetContent className="custom-content">
          <SheetHeader className="custom-header">
            <SheetTitle className="custom-title">t</SheetTitle>
            <SheetDescription className="custom-description">d</SheetDescription>
          </SheetHeader>
          <SheetFooter className="custom-footer">f</SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    expect(baseElement.querySelector('[data-slot="sheet-content"]')).toHaveClass('custom-content');
    expect(baseElement.querySelector('[data-slot="sheet-header"]')).toHaveClass('custom-header');
    expect(baseElement.querySelector('[data-slot="sheet-title"]')).toHaveClass('custom-title');
    expect(baseElement.querySelector('[data-slot="sheet-description"]')).toHaveClass('custom-description');
    expect(baseElement.querySelector('[data-slot="sheet-footer"]')).toHaveClass('custom-footer');
  });
});
