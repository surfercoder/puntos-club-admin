export const PRODUCT_IMAGE_WIDTH = 1200;
export const PRODUCT_IMAGE_HEIGHT = 675;
export const LOGO_IMAGE_SIZE = 512;

/**
 * Letterboxes any upload into a 1200x675 (16:9) WebP so every product image
 * reaches the mobile app with the same aspect ratio. The app renders the card
 * image with `cover` at a device-dependent width, so a 1:1 or portrait upload
 * loses half its content there; a fixed 16:9 canvas keeps that crop marginal.
 * Org logos go through the same path on a 512x512 canvas; the letterbox stays
 * transparent, so a wide logo keeps its background-free edges.
 * Falls back to the original file if the browser cannot decode or encode it.
 */
export async function normalizeProductImage(
  file: File,
  targetWidth = PRODUCT_IMAGE_WIDTH,
  targetHeight = PRODUCT_IMAGE_HEIGHT,
): Promise<File> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) return file;

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(targetWidth / bitmap.width, targetHeight / bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(
      bitmap,
      (targetWidth - width) / 2,
      (targetHeight - height) / 2,
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
