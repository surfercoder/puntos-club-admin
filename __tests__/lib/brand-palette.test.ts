import { brandPalette, dominantColors } from '@/lib/brand-palette';

const pixels = (...groups: [number, number[]][]) =>
  new Uint8ClampedArray(groups.flatMap(([n, rgba]) => Array(n).fill(rgba).flat()));

describe('brandPalette', () => {
  it('returns null without a valid seed', () => {
    expect(brandPalette(null)).toBeNull();
    expect(brandPalette('red')).toBeNull();
  });

  it('keeps a color that already contrasts with white text', () => {
    const palette = brandPalette('#D7141A')!;
    expect(palette.violet).toBe('#D7141A');
    expect(palette.violetSoft).toBe('#FBE8E8');
    expect(palette.headerGrad).toEqual(['#BD1217', '#D7141A']);
  });

  it('darkens a light color until white text reads on it', () => {
    expect(brandPalette('#FFD400')!.violet).toBe('#8A7300');
  });
});

describe('dominantColors', () => {
  it('orders by presence, skipping transparent, white and near-duplicate pixels', () => {
    const data = pixels(
      [5, [215, 20, 26, 255]],
      [9, [255, 255, 255, 255]],
      [1, [0, 0, 0, 0]],
      [1, [230, 30, 40, 255]],
      [2, [20, 40, 200, 255]],
      [1, [10, 10, 10, 255]],
    );
    expect(dominantColors(data)).toEqual(['#D7141A', '#1428C8']);
  });

  it('falls back to greys when the logo has no saturated color', () => {
    expect(dominantColors(pixels([2, [10, 10, 10, 255]], [1, [255, 255, 255, 255]]))).toEqual([
      '#0A0A0A',
    ]);
  });

  it('stops at the requested amount', () => {
    const data = pixels([3, [200, 0, 0, 255]], [2, [0, 200, 0, 255]], [1, [0, 0, 200, 255]]);
    expect(dominantColors(data, 2)).toEqual(['#C80000', '#00C800']);
  });
});
