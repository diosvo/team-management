import { processImage, uploadFile, uploadImage } from '.';

vi.mock('./image-processor', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./image-processor')>()),
  processImage: vi.fn(),
}));

vi.mock('./local-storage', () => ({
  deleteFile: vi.fn(),
  getFile: vi.fn(),
  getFileBytes: vi.fn(),
  uploadFile: vi.fn(),
}));

describe('uploadImage', () => {
  test('stores the processed image as WebP under the prefix', async () => {
    const file = new Blob(['png']);
    const data = Buffer.from('webp');
    vi.mocked(processImage).mockResolvedValue({
      data,
      width: 1,
      height: 1,
      originalSize: 3,
      size: 4,
    });
    vi.mocked(uploadFile).mockResolvedValue({ pathname: 'users/1/a.webp' });

    const result = await uploadImage('users/1', file);

    expect(processImage).toHaveBeenCalledWith(file);
    expect(uploadFile).toHaveBeenCalledWith('users/1', data, 'webp');
    expect(result).toEqual({ pathname: 'users/1/a.webp' });
  });
});
