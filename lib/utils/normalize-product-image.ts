export const PRODUCT_IMAGE_WIDTH = 1200;
export const PRODUCT_IMAGE_HEIGHT = 675;

/**
 * Letterboxes any upload into a 1200x675 (16:9) WebP so every product image
 * reaches the mobile app with the same aspect ratio. The app renders the card
 * image with `cover` at a device-dependent width, so a 1:1 or portrait upload
 * loses half its content there; a fixed 16:9 canvas keeps that crop marginal.
 * Falls back to the original file if the browser cannot decode or encode it.
 */
export async function normalizeProductImage(file: File): Promise<File> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = PRODUCT_IMAGE_WIDTH;
    canvas.height = PRODUCT_IMAGE_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) return file;

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(PRODUCT_IMAGE_WIDTH / bitmap.width, PRODUCT_IMAGE_HEIGHT / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(
      bitmap,
      (PRODUCT_IMAGE_WIDTH - width) / 2,
      (PRODUCT_IMAGE_HEIGHT - height) / 2,
      width,
      height,
    );
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.85);
    });
    if (!blob) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
  } catch (_error) {
    return file;
  }
}
