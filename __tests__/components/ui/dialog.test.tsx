import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const openDialog = (content: React.ReactNode) =>
  render(
    <Dialog defaultOpen>
      <DialogTrigger>Abrir</DialogTrigger>
      {content}
    </Dialog>,
  );

describe('Dialog', () => {
  it('opens from its trigger and renders title, description and body', async () => {
    render(
      <Dialog>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar compra</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar compra')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('renders a close button by default and closes on click', async () => {
    openDialog(
      <DialogContent>
        <DialogTitle>Eliminar compra</DialogTitle>
      </DialogContent>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('omits the close button when showCloseButton is false', () => {
    openDialog(
      <DialogContent showCloseButton={false}>
        <DialogTitle>Eliminar compra</DialogTitle>
      </DialogContent>,
    );

    expect(screen.queryByRole('button', { name: 'close' })).not.toBeInTheDocument();
  });

  it('renders no footer close action by default and one when asked', () => {
    const { rerender } = render(
      <Dialog defaultOpen>
        <DialogContent showCloseButton={false}>
          <DialogTitle>t</DialogTitle>
          <DialogFooter>
            <button type="button">Guardar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole('button', { name: 'close' })).not.toBeInTheDocument();

    rerender(
      <Dialog defaultOpen>
        <DialogContent showCloseButton={false}>
          <DialogTitle>t</DialogTitle>
          <DialogFooter showCloseButton>
            <button type="button">Guardar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'close' })).toBeInTheDocument();
  });

  it('closes through an explicit DialogClose', async () => {
    openDialog(
      <DialogContent showCloseButton={false}>
        <DialogTitle>t</DialogTitle>
        <DialogClose>Cancelar</DialogClose>
      </DialogContent>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('merges custom classNames into content, overlay, header, footer, title and description', () => {
    const { baseElement } = render(
      <Dialog defaultOpen>
        <DialogPortal>
          <DialogOverlay className="custom-overlay" />
        </DialogPortal>
        <DialogContent className="custom-content">
          <DialogHeader className="custom-header">
            <DialogTitle className="custom-title">t</DialogTitle>
            <DialogDescription className="custom-description">d</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer">f</DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(baseElement.querySelector('.custom-overlay')).toBeInTheDocument();
    expect(baseElement.querySelector('[data-slot="dialog-content"]')).toHaveClass('custom-content');
    expect(baseElement.querySelector('[data-slot="dialog-header"]')).toHaveClass('custom-header');
    expect(baseElement.querySelector('[data-slot="dialog-footer"]')).toHaveClass('custom-footer');
    expect(baseElement.querySelector('[data-slot="dialog-title"]')).toHaveClass('custom-title');
    expect(baseElement.querySelector('[data-slot="dialog-description"]')).toHaveClass('custom-description');
  });
});
