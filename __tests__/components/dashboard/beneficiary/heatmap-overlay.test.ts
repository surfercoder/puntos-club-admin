import { createHeatmapOverlay } from '@/components/dashboard/beneficiary/heatmap-overlay';

/** Contexto 2D mínimo: jsdom no implementa canvas, así que lo fingimos. */
function fakeContext() {
  const gradient = { addColorStop: jest.fn() };
  return {
    createRadialGradient: jest.fn(() => gradient),
    createLinearGradient: jest.fn(() => gradient),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    putImageData: jest.fn(),
    getImageData: jest.fn((_x: number, _y: number, w: number, h: number) => ({
      // Dos píxeles: uno vacío y uno con alfa, para cubrir las dos ramas del coloreo.
      data: new Uint8ClampedArray(Math.max(w * h, 2) * 4).fill(0).map((_, i) =>
        i >= 4 && (i + 1) % 4 === 0 ? 120 : 0,
      ),
    })),
    fillStyle: '',
  };
}

let ctx: ReturnType<typeof fakeContext>;

const panes = { overlayLayer: { appendChild: jest.fn() } };

class FakeOverlayView {
  setMap = jest.fn();
  getPanes = jest.fn(() => panes);
  getProjection = jest.fn(() => ({
    fromLatLngToDivPixel: jest.fn((latLng: { lat: number; lng: number }) => ({
      x: latLng.lat * 10,
      y: latLng.lng * 10,
    })),
  }));
}

const bounds = {
  getNorthEast: () => ({ lat: () => 10, lng: () => 20 }),
  getSouthWest: () => ({ lat: () => 0, lng: () => 0 }),
};

const map = { getBounds: () => bounds } as unknown as google.maps.Map;

beforeEach(() => {
  jest.clearAllMocks();
  ctx = fakeContext();
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ctx) as never;
  (globalThis as never as { google: unknown }).google = {
    maps: {
      OverlayView: FakeOverlayView,
      LatLng: class {
        constructor(public lat: number, public lng: number) {}
      },
    },
  };
});

describe('createHeatmapOverlay', () => {
  it('attaches a canvas to the overlay pane and paints the points', () => {
    const overlay = createHeatmapOverlay(map, [{ lat: 1, lng: 2 }]);
    overlay.setMap(map);
    overlay.onAdd();
    expect(panes.overlayLayer.appendChild).toHaveBeenCalled();

    overlay.draw();
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it('repaints when the points change', () => {
    const overlay = createHeatmapOverlay(map, [{ lat: 1, lng: 2 }]);
    overlay.onAdd();
    overlay.setPoints([{ lat: 3, lng: 4 }, { lat: 5, lng: 6 }]);
    expect(panes.overlayLayer.appendChild).toHaveBeenCalledTimes(1);
  });

  it('does nothing before the canvas exists', () => {
    const overlay = createHeatmapOverlay(map, []);
    expect(() => overlay.draw()).not.toThrow();
  });

  it('detaches the canvas on removal', () => {
    const overlay = createHeatmapOverlay(map, []);
    overlay.onAdd();
    overlay.onRemove();
    overlay.onRemove();
    expect(panes.overlayLayer.appendChild).toHaveBeenCalledTimes(1);
  });
});
