import { processImage } from './image-processor';
import { uploadFile } from './local-storage';

export {
  ImageValidationError,
  MAX_IMAGE_BYTES,
  processImage,
} from './image-processor';
export { deleteFile, getFile, getFileBytes, uploadFile } from './local-storage';

/** Validate an uploaded image, convert it to WebP and store it under `prefix`. */
export async function uploadImage(
  prefix: string,
  file: Blob,
): Promise<{ pathname: string }> {
  const { data } = await processImage(file);

  return await uploadFile(prefix, data, 'webp');
}
