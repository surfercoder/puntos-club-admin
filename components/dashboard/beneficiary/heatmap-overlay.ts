/**
 * Mapa de calor sobre un google.maps.Map.
 *
 * `google.maps.visualization.HeatmapLayer` fue removido de la API en la v3.65,
 * así que pintamos la capa nosotros: un canvas donde cada punto suma un
 * gradiente radial de alfa y después coloreamos ese alfa con una rampa.
 */

type Gradient = [number, string][];

const GRADIENT: Gradient = [
  [0.2, "#4BB562"],
  [0.45, "#F8D44C"],
  [0.7, "#FD7E14"],
  [1, "#E5352B"],
];

const RADIUS = 34;
const BLUR = 22;

function buildBrush(): HTMLCanvasElement {
  const size = (RADIUS + BLUR) * 2;
  const brush = document.createElement("canvas");
  brush.width = size;
  brush.height = size;
  const ctx = brush.getContext("2d")!;
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(0,0,0,0.85)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return brush;
}

/** LUT de 256 colores: el alfa acumulado indexa el color final. */
function buildPalette(): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [stop, color] of GRADIENT) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

export type HeatmapOverlay = google.maps.OverlayView & {
  setPoints: (points: google.maps.LatLngLiteral[]) => void;
};

export function createHeatmapOverlay(
  map: google.maps.Map,
  points: google.maps.LatLngLiteral[],
): HeatmapOverlay {
  class Heatmap extends google.maps.OverlayView {
    private canvas: HTMLCanvasElement | null = null;
    private points = points;
    private readonly brush = buildBrush();
    private readonly palette = buildPalette();

    setPoints(next: google.maps.LatLngLiteral[]) {
      this.points = next;
      this.draw();
    }

    onAdd() {
      const canvas = document.createElement("canvas");
      canvas.style.position = "absolute";
      canvas.style.pointerEvents = "none";
      this.canvas = canvas;
      this.getPanes()!.overlayLayer.appendChild(canvas);
    }

    onRemove() {
      this.canvas?.remove();
      this.canvas = null;
    }

    draw() {
      const canvas = this.canvas;
      const projection = this.getProjection();
      /* c8 ignore next */
      if (!canvas || !projection) return;

      const bounds = map.getBounds();
      /* c8 ignore next */
      if (!bounds) return;

      const topLeft = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()),
      )!;
      const bottomRight = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getNorthEast().lng()),
      )!;

      const width = Math.ceil(bottomRight.x - topLeft.x);
      const height = Math.ceil(bottomRight.y - topLeft.y);
      canvas.width = width;
      canvas.height = height;
      canvas.style.left = `${topLeft.x}px`;
      canvas.style.top = `${topLeft.y}px`;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, width, height);

      const offset = RADIUS + BLUR;
      for (const point of this.points) {
        const pixel = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(point.lat, point.lng),
        )!;
        ctx.drawImage(this.brush, pixel.x - topLeft.x - offset, pixel.y - topLeft.y - offset);
      }

      /* c8 ignore next */
      if (width === 0 || height === 0) return;

      const image = ctx.getImageData(0, 0, width, height);
      const pixels = image.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        /* c8 ignore next */
        if (alpha === 0) continue;
        const offsetInPalette = alpha * 4;
        pixels[i] = this.palette[offsetInPalette];
        pixels[i + 1] = this.palette[offsetInPalette + 1];
        pixels[i + 2] = this.palette[offsetInPalette + 2];
        pixels[i + 3] = Math.min(alpha + 40, 220);
      }
      ctx.putImageData(image, 0, 0);
    }
  }

  const overlay = new Heatmap();
  overlay.setMap(map);
  return overlay;
}
