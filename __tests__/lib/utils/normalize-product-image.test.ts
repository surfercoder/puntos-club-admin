import { normalizeProductImage } from '@/lib/utils/normalize-product-image';

const drawImage = jest.fn();
const close = jest.fn();
let toBlobResult: Blob | null = new Blob(['webp'], { type: 'image/webp' });
let context: unknown = { drawImage };

const mockCanvas = () => {
  jest.spyOn(document, 'createElement').mockReturnValue({
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (callback: (blob: Blob | null) => void) => callback(toBlobResult),
  } as unknown as HTMLElement);
};

const source = new File(['x'], 'banner.png', { type: 'image/png' });

describe('normalizeProductImage', () => {
  beforeEach(() => {
    context = { drawImage };
    toBlobResult = new Blob(['webp'], { type: 'image/webp' });
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap = jest
      .fn()
      .mockResolvedValue({ width: 1000, height: 1000, close });
    mockCanvas();
  });

  afterEach(() => jest.restoreAllMocks());

  it('letterboxes a square image into a centred 16:9 webp', async () => {
    const result = await normalizeProductImage(source);

    expect(result.type).toBe('image/webp');
    expect(result.name).toBe('banner.webp');
    // 1000x1000 scaled to fit 675px tall, centred horizontally on the 1200px canvas.
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 262.5, 0, 675, 675);
    expect(close).toHaveBeenCalled();
  });

  it('scales a wide image to the full canvas width', async () => {
    (globalThis as { createImageBitmap: jest.Mock }).createImageBitmap.mockResolvedValue({
      width: 2400,
      height: 600,
      close,
    });

    await normalizeProductImage(source);

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 187.5, 1200, 300);
  });

  it('keeps the original file when the canvas has no 2d context', async () => {
    context = null;
    expect(await normalizeProductImage(source)).toBe(source);
  });

  it('keeps the original file when encoding produces no blob', async () => {
    toBlobResult = null;
    expect(await normalizeProductImage(source)).toBe(source);
  });

  it('keeps the original file when the image cannot be decoded', async () => {
    (globalThis as { createImageBitmap: jest.Mock }).createImageBitmap.mockRejectedValue(new Error('corrupt'));
    expect(await normalizeProductImage(source)).toBe(source);
  });
});
