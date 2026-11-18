import sharp from 'sharp';

import {
  ImageValidationError,
  MAX_IMAGE_BYTES,
  processImage,
} from './image-processor';

const image = async (
  format: 'png' | 'jpeg' | 'gif',
  width: number,
  height: number,
  orientation?: number,
) => {
  let pipeline = sharp({
    create: { width, height, channels: 3, background: '#ff0000' },
  });
  if (orientation) pipeline = pipeline.withMetadata({ orientation });

  const bytes = await pipeline.toFormat(format).toBuffer();
  return new Blob([new Uint8Array(bytes)]);
};

const expectRejection = async (
  promise: Promise<unknown>,
  reason: ImageValidationError['reason'],
) => {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ImageValidationError);
  expect((error as ImageValidationError).reason).toBe(reason);
};

describe('processImage', () => {
  test('converts a PNG to WebP fitted inside 512 px', async () => {
    const file = await image('png', 2000, 1000);

    const result = await processImage(file);

    expect(result).toMatchObject({
      width: 512,
      height: 256,
      originalSize: file.size,
      size: result.data.byteLength,
    });
    expect((await sharp(result.data).metadata()).format).toBe('webp');
  });

  test('applies EXIF orientation to a JPEG', async () => {
    // Orientation 6 = rotate 90° clockwise: 100×50 displays as 50×100
    const result = await processImage(await image('jpeg', 100, 50, 6));

    expect(result).toMatchObject({ width: 50, height: 100 });
  });

  test('never enlarges a small image', async () => {
    const result = await processImage(await image('png', 40, 30));

    expect(result).toMatchObject({ width: 40, height: 30 });
  });

  test('honours custom dimension and quality options', async () => {
    const file = await image('png', 400, 400);

    const result = await processImage(file, { maxDimension: 100, quality: 50 });

    expect(result).toMatchObject({ width: 100, height: 100 });
  });

  test('rejects a file over the size limit without decoding it', async () => {
    const file = new Blob([new Uint8Array(MAX_IMAGE_BYTES + 1)]);

    await expectRejection(processImage(file), 'imageTooLarge');
  });

  test('rejects image formats other than JPEG and PNG', async () => {
    await expectRejection(
      processImage(await image('gif', 10, 10)),
      'invalidImage',
    );
  });

  test('rejects bytes that are not an image', async () => {
    await expectRejection(
      processImage(new Blob(['definitely not an image'])),
      'invalidImage',
    );
  });

  test('rejects a truncated image', async () => {
    const bytes = new Uint8Array(
      await (await image('jpeg', 300, 300)).arrayBuffer(),
    );

    await expectRejection(
      processImage(new Blob([bytes.slice(0, bytes.length / 2)])),
      'invalidImage',
    );
  });
});
