import { createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { reorderProducts } from '@/actions/dashboard/product/actions';
import { SortableProductRows } from '@/components/dashboard/product/sortable-product-rows';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/actions/dashboard/product/actions', () => ({
  reorderProducts: jest.fn(() => Promise.resolve({ error: null })),
}));

const rows = (ids: string[]) => ids.map((id) => ({ id, cells: <td>{`P${id}`}</td> }));

function renderRows(ids: string[]) {
  return render(
    <table>
      <tbody>
        <SortableProductRows rows={rows(ids)} />
      </tbody>
    </table>,
  );
}

const names = () => screen.getAllByText(/^P\d$/).map((cell) => cell.textContent);
const handles = () => screen.getAllByRole('button', { name: 'handle' });
const row = (name: string) => screen.getByText(name).closest('tr')!;

beforeEach(() => jest.clearAllMocks());

describe('SortableProductRows', () => {
  // jsdom no hace layout ni pointer events: cada fila mide 40px y arranca en
  // 40 * su índice, y button/clientY se ponen a mano en el evento.
  const offsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')!;
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get(this: HTMLElement) {
        return this.tagName === 'TR' ? Array.from(this.parentElement!.children).indexOf(this) * 40 : 0;
      },
    });
    HTMLElement.prototype.setPointerCapture = jest.fn();
    HTMLElement.prototype.animate = jest.fn();
  });
  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', offsetTop);
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });

  const handleOf = (name: string) => within(row(name)).getByRole('button', { name: 'handle' });
  const pointer = (
    type: 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel',
    name: string,
    init: { button?: number; clientY?: number } = {},
  ) => {
    const target = handleOf(name);
    const event = createEvent[type](target);
    Object.defineProperty(event, 'button', { value: init.button ?? 0 });
    Object.defineProperty(event, 'clientY', { value: init.clientY ?? 0 });
    fireEvent(target, event);
  };
  const shaded = (name: string) => row(name).className.includes('border-dashed');

  it('shades the slot where the row will land while dragging and saves it on release', async () => {
    renderRows(['1', '2', '3']);
    pointer('pointerDown', 'P1');
    expect(HTMLElement.prototype.setPointerCapture).toHaveBeenCalled();
    expect(handleOf('P1')).toHaveFocus();
    expect(shaded('P1')).toBe(true);
    pointer('pointerMove', 'P1', { clientY: 20 });
    expect(names()).toEqual(['P1', 'P2', 'P3']);
    pointer('pointerMove', 'P1', { clientY: 95 });
    expect(names()).toEqual(['P2', 'P3', 'P1']);
    pointer('pointerMove', 'P1', { clientY: 45 });
    expect(names()).toEqual(['P2', 'P1', 'P3']);
    expect(shaded('P1')).toBe(true);
    expect(reorderProducts).not.toHaveBeenCalled();
    pointer('pointerUp', 'P1');
    expect(names()).toEqual(['P2', 'P1', 'P3']);
    expect(shaded('P1')).toBe(false);
    await waitFor(() => expect(reorderProducts).toHaveBeenCalledWith(['2', '1', '3']));
  });

  it('discards the preview on Escape or pointercancel', () => {
    renderRows(['1', '2']);
    pointer('pointerDown', 'P1');
    pointer('pointerMove', 'P1', { clientY: 60 });
    expect(names()).toEqual(['P2', 'P1']);
    fireEvent.keyDown(handleOf('P1'), { key: 'ArrowUp' });
    expect(names()).toEqual(['P2', 'P1']);
    fireEvent.keyDown(handleOf('P1'), { key: 'Escape' });
    expect(names()).toEqual(['P1', 'P2']);

    pointer('pointerDown', 'P1');
    pointer('pointerMove', 'P1', { clientY: 60 });
    pointer('pointerCancel', 'P1');
    expect(names()).toEqual(['P1', 'P2']);
    expect(reorderProducts).not.toHaveBeenCalled();
  });

  it('ignores secondary buttons, moves without a drag, and releases that change nothing', () => {
    renderRows(['1', '2']);
    pointer('pointerDown', 'P1', { button: 2 });
    pointer('pointerMove', 'P1', { clientY: 60 });
    expect(shaded('P1')).toBe(false);
    pointer('pointerDown', 'P1');
    pointer('pointerMove', 'P1', { clientY: 10 });
    pointer('pointerUp', 'P1');
    expect(names()).toEqual(['P1', 'P2']);
    expect(reorderProducts).not.toHaveBeenCalled();
  });

  it('ignores a move whose handle is no longer inside the table body', () => {
    renderRows(['1', '2']);
    pointer('pointerDown', 'P1');
    const handle = handleOf('P1');
    const event = createEvent.pointerMove(handle);
    Object.defineProperty(event, 'clientY', { value: 60 });
    const closest = jest.spyOn(HTMLElement.prototype, 'closest').mockReturnValue(null);
    fireEvent(handle, event);
    closest.mockRestore();
    expect(names()).toEqual(['P1', 'P2']);
  });

  it('slides the rows that changed place, unless the user asked for reduced motion', () => {
    const animate = HTMLElement.prototype.animate as jest.Mock;
    renderRows(['1', '2', '3']);
    expect(animate).not.toHaveBeenCalled();
    fireEvent.keyDown(handles()[0], { key: 'ArrowDown' });
    expect(animate).toHaveBeenCalledTimes(2);
    expect(animate).toHaveBeenCalledWith(
      [{ transform: 'translateY(-40px)' }, { transform: 'none' }],
      expect.objectContaining({ duration: 180 }),
    );

    animate.mockClear();
    (window.matchMedia as jest.Mock).mockReturnValueOnce({ matches: true });
    fireEvent.keyDown(handles()[0], { key: 'ArrowDown' });
    expect(animate).not.toHaveBeenCalled();
  });

  it('moves with the arrow keys and stops at the edges', () => {
    renderRows(['1', '2']);
    fireEvent.keyDown(handles()[0], { key: 'ArrowUp' });
    fireEvent.keyDown(handles()[1], { key: 'ArrowDown' });
    fireEvent.keyDown(handles()[0], { key: 'Enter' });
    expect(reorderProducts).not.toHaveBeenCalled();
    fireEvent.keyDown(handles()[0], { key: 'ArrowDown' });
    expect(names()).toEqual(['P2', 'P1']);
    fireEvent.keyDown(handles()[1], { key: 'ArrowUp' });
    expect(names()).toEqual(['P1', 'P2']);
  });

  it('reverts and warns when saving fails', async () => {
    (reorderProducts as jest.Mock).mockResolvedValueOnce({ error: { message: 'fail' } });
    renderRows(['1', '2']);
    fireEvent.keyDown(handles()[0], { key: 'ArrowDown' });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('error'));
    expect(names()).toEqual(['P1', 'P2']);
  });

  it('keeps the chosen order across refreshes, dropping deleted rows and appending new ones', () => {
    const { rerender } = renderRows(['1', '2', '3']);
    fireEvent.keyDown(handles()[0], { key: 'ArrowDown' });
    rerender(
      <table>
        <tbody>
          <SortableProductRows rows={rows(['1', '3', '4'])} />
        </tbody>
      </table>,
    );
    expect(names()).toEqual(['P1', 'P3', 'P4']);
  });
});
