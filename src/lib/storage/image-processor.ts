import sharp from 'sharp';

/** Largest image upload accepted, before processing. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Avatars and logos never render larger than this, so we store at most this size. */
export const MAX_IMAGE_DIMENSION = 512;

export const WEBP_QUALITY = 80;

/** Formats read from the file's bytes, not from its declared MIME type. */
const ACCEPTED_FORMATS = new Set<string>(['jpeg', 'png']);

export type ImageRejection = 'imageTooLarge' | 'invalidImage';

export class ImageValidationError extends Error {
  constructor(readonly reason: ImageRejection) {
    super(reason);
    this.name = 'ImageValidationError';
  }
}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  originalSize: number;
  size: number;
}

/**
 * Validate an uploaded JPEG/PNG and convert it to a resized WebP:
 * EXIF orientation applied, fitted inside `maxDimension`, never enlarged.
 */
export async function processImage(
  file: Blob,
  {
    maxDimension = MAX_IMAGE_DIMENSION,
    quality = WEBP_QUALITY,
  }: Partial<{ maxDimension: number; quality: number }> = {},
): Promise<ProcessedImage> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError('imageTooLarge');
  }

  const input = new Uint8Array(await file.arrayBuffer());

  try {
    const { format } = await sharp(input).metadata();

    if (!format || !ACCEPTED_FORMATS.has(format)) {
      throw new ImageValidationError('invalidImage');
    }

    const { data, info } = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      width: info.width,
      height: info.height,
      originalSize: file.size,
      size: info.size,
    };
  } catch (error) {
    if (error instanceof ImageValidationError) throw error;
    // Sharp throws on bytes it cannot decode (corrupt or not an image).
    throw new ImageValidationError('invalidImage');
  }
}
