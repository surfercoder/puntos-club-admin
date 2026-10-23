"use client";

import { GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { reorderProducts } from '@/actions/dashboard/product/actions';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface SortableProductRowsProps {
  rows: { id: string; cells: ReactNode }[];
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Las celdas las arma la página (server); acá solo se reordenan. Se arrastra
// desde la manija con pointer events (mouse y touch) y no con el drag and drop
// nativo: el nativo muestra una foto fantasma, Chrome lo cancela si la fila
// cambia en el dragstart y no anda en touch. Con teclado, flechas sobre la
// manija. Cada movimiento guarda la lista entera y, si falla, vuelve atrás.
export function SortableProductRows({ rows }: SortableProductRowsProps) {
  const t = useTranslations('Dashboard.product.reorder');
  // Solo se guarda el orden de ids: las celdas siguen viniendo de props, así
  // un refresh() (alta, borrado, edición) no deja contenido viejo en pantalla.
  const [ids, setIds] = useState(() => rows.map((row) => row.id));
  // Mientras se arrastra se muestra `preview`: la fila arrastrada ya ocupa,
  // sombreada, el lugar donde caería y las demás se corren. Soltar guarda;
  // Esc o un pointercancel lo descartan.
  const [dragging, setDragging] = useState<{ id: string; preview: string[] } | null>(null);
  const rowEls = useRef(new Map<string, HTMLTableRowElement>());
  const lastTops = useRef(new Map<string, number>());

  const byId = new Map(rows.map((row) => [row.id, row]));
  const savedIds = new Set(ids);
  const order = [
    ...ids.filter((id) => byId.has(id)),
    ...rows.filter((row) => !savedIds.has(row.id)).map((row) => row.id),
  ];
  const shown = dragging?.preview ?? order;

  // FLIP: cada fila que cambió de lugar arranca desplazada a donde estaba y
  // se desliza a la posición nueva. offsetTop y no getBoundingClientRect para
  // que un scroll no se lea como movimiento.
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rowEls.current.forEach((el, id) => {
      const top = el.offsetTop;
      const previous = lastTops.current.get(id);
      lastTops.current.set(id, top);
      if (reduceMotion || previous === undefined || previous === top) return;
      el.animate(
        [{ transform: `translateY(${previous - top}px)` }, { transform: 'none' }],
        { duration: 180, easing: 'ease-out' },
      );
    });
  });

  const save = async (next: string[]) => {
    const previous = ids;
    setIds(next);
    const { error } = await reorderProducts(next);
    if (error) {
      setIds(previous);
      toast.error(t('error'));
    }
  };

  // Fila bajo el puntero, con posiciones de layout (offsetTop) y no de
  // pantalla: las filas que se están animando tienen transform y harían que
  // el destino rebote entre dos lugares.
  const rowIndexAt = (clientY: number, tbody: HTMLElement) => {
    const y = clientY - tbody.getBoundingClientRect().top + tbody.offsetTop;
    let index = 0;
    shown.forEach((id, i) => {
      const el = rowEls.current.get(id);
      if (el && el.offsetTop <= y) index = i;
    });
    return index;
  };

  const finishDrag = (commit: boolean) => {
    if (commit && dragging && dragging.preview.join() !== order.join()) {
      void save(dragging.preview);
    }
    setDragging(null);
  };

  return shown.map((id, index) => (
    <TableRow
      key={id}
      ref={(el) => {
        if (el) rowEls.current.set(id, el);
        else rowEls.current.delete(id);
      }}
      className={cn(
        dragging?.id === id &&
          'bg-primary/15 hover:bg-primary/15 [&>td]:border-y-2 [&>td]:border-dashed [&>td]:border-primary',
      )}
    >
      <TableCell className="w-8 pr-0">
        <button
          type="button"
          aria-label={t('handle')}
          title={t('handle')}
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            // Sin preventDefault el navegador arranca una selección de texto;
            // el focus a mano es para que Esc llegue al onKeyDown.
            e.preventDefault();
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging({ id, preview: order });
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            const tbody = e.currentTarget.closest('tbody');
            if (!tbody) return;
            const to = rowIndexAt(e.clientY, tbody);
            const from = shown.indexOf(dragging.id);
            if (to !== from) {
              setDragging({ id: dragging.id, preview: move(shown, from, to) });
            }
          }}
          onPointerUp={() => finishDrag(true)}
          onPointerCancel={() => finishDrag(false)}
          onKeyDown={(e) => {
            if (dragging) {
              if (e.key === 'Escape') finishDrag(false);
              return;
            }
            const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null;
            if (to === null || to < 0 || to >= order.length) return;
            e.preventDefault();
            void save(move(order, index, to));
          }}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {byId.get(id)?.cells}
    </TableRow>
  ));
}
