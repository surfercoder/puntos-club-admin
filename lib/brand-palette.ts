// --- Branding de la org (organization.brand_color) ---
// Copia exacta de brandPalette de las apps de beneficiario (PuntosClub/
// constants/theme.ts y puntos-club-web/src/lib/theme.ts): el admin la usa
// solo para la vista previa, asi el owner ve el color que de verdad va a
// salir despues del ajuste de contraste. Si cambia alla, cambia aca.
type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

const toHex = (rgb: Rgb) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

// t=0 deja el color, t=1 lo lleva entero a `to`.
const mix = (rgb: Rgb, to: Rgb, t: number): Rgb =>
  rgb.map((v, i) => v + (to[i] - v) * t) as Rgb;

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

// Luminancia relativa de WCAG.
const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const brandPalette = (seed: string | null | undefined) => {
  if (!seed || !/^#[0-9A-Fa-f]{6}$/.test(seed)) return null;
  // El acento lleva texto blanco encima (barra, botones, caja de puntos):
  // se oscurece hasta 4.5:1. Un amarillo o un celeste claro salen mas
  // profundos que el logo, pero legibles.
  let p = toRgb(seed);
  while (1.05 / (luminance(p) + 0.05) < 4.5) p = mix(p, BLACK, 0.05);

  const main = toHex(p);
  const soft = toHex(mix(p, WHITE, 0.9));
  const softer = toHex(mix(p, WHITE, 0.94));
  const grad = [toHex(mix(p, BLACK, 0.12)), main] as const;

  return {
    violet: main,
    purple: main,
    purpleDeep: main,
    purpleInk: main,
    magenta: main,
    pink: main,
    pinkAccent: main,
    violetSoft: soft,
    purpleSoft: soft,
    magentaSoft: soft,
    lilac: soft,
    purpleTint: softer,
    lilacRow: softer,
    pinkLine: toHex(mix(p, WHITE, 0.7)),
    brand: grad,
    headerGrad: grad,
    pinkGrad: grad,
    pointsGrad: grad,
  };
};

// Colores dominantes de los pixeles RGBA de un logo (getImageData), para que
// el owner elija la semilla de brandPalette. Se agrupan en cubos de 16 tonos
// por canal y se promedia cada cubo. Fuera: transparentes, casi blancos (el
// fondo de casi todo logo) y grises sin saturacion, salvo que el logo sea
// entero gris o negro. Dos colores a menos de 60 de distancia cuentan como uno.
export const dominantColors = (data: Uint8ClampedArray, max = 4) => {
  const vivid = new Map<number, number[]>();
  const neutral = new Map<number, number[]>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128 || Math.min(r, g, b) > 235) continue;
    const buckets = Math.max(r, g, b) - Math.min(r, g, b) < 30 ? neutral : vivid;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const sum = buckets.get(key) ?? [0, 0, 0, 0];
    buckets.set(key, [sum[0] + r, sum[1] + g, sum[2] + b, sum[3] + 1]);
  }

  const picked: Rgb[] = [];
  const sorted = [...(vivid.size ? vivid : neutral).values()].sort((x, y) => y[3] - x[3]);
  for (const [r, g, b, n] of sorted) {
    const rgb: Rgb = [r / n, g / n, b / n];
    if (picked.some((p) => Math.hypot(...p.map((v, i) => v - rgb[i])) < 60)) continue;
    picked.push(rgb);
    if (picked.length === max) break;
  }
  return picked.map(toHex);
};
