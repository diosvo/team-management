import {
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { toaster } from '@/components/ui/toaster';

import ImageUploader, { notifyRejection } from './ImageUploader';

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('ImageUploader', () => {
  setupTestLifecycle();

  const onChange = vi.fn();

  const setup = (props: Partial<Parameters<typeof ImageUploader>[0]> = {}) =>
    renderWithUI(
      <ImageUploader
        src="data:image/png;base64,abc"
        fallback="Test User"
        onChange={onChange}
        {...props}
      />,
    );

  const getFileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;

  const getOverlay = (container: HTMLElement) =>
    container.querySelector('.avatar-overlay') as HTMLElement;

  const pngFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  describe('states', () => {
    test('editable (default): input enabled, overlay visible, avatar shown', async () => {
      const { container } = setup();

      await waitFor(() => {
        expect(getFileInput(container)).toBeEnabled();
        expect(getOverlay(container)).not.toHaveAttribute('hidden');
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    test('disabled: input disabled and overlay hidden', async () => {
      const { container } = setup({ state: 'disabled' });

      await waitFor(() => {
        expect(getFileInput(container)).toBeDisabled();
        expect(getOverlay(container)).toHaveAttribute('hidden');
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    test('pending: input disabled and avatar replaced by skeleton', async () => {
      const { container } = setup({ state: 'pending' });

      await waitFor(() => {
        expect(getFileInput(container)).toBeDisabled();
        expect(screen.queryByText('Test User')).not.toBeInTheDocument();
        expect(container.querySelector('.chakra-skeleton')).toBeInTheDocument();
      });
    });

    test('renders the fallback without a src', async () => {
      setup({ src: undefined });

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });
  });

  describe('file selection', () => {
    test('forwards an accepted file to onChange', async () => {
      const { container, user } = setup();

      await user.upload(getFileInput(container), pngFile);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(pngFile);
      });
      expect(toaster.create).not.toHaveBeenCalled();
    });

    test('surfaces an oversized file through the reject handler', async () => {
      const bigFile = new File([new Uint8Array(100_001)], 'big.png', {
        type: 'image/png',
      });

      const { container, user } = setup();

      await user.upload(getFileInput(container), bigFile);

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Image must be smaller than 100 KB',
          }),
        );
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('notifyRejection', () => {
    test('does nothing when there are no rejected files', () => {
      notifyRejection([]);

      expect(toaster.create).not.toHaveBeenCalled();
    });

    test('reports an oversized file', () => {
      notifyRejection([{ errors: ['FILE_TOO_LARGE'] }]);

      expect(toaster.create).toHaveBeenCalledWith({
        type: 'error',
        title: 'Image must be smaller than 100 KB',
      });
    });

    test('reports an unsupported file type', () => {
      notifyRejection([{ errors: ['FILE_INVALID_TYPE'] }]);

      expect(toaster.create).toHaveBeenCalledWith({
        type: 'error',
        title: 'Only PNG or JPEG images are allowed',
      });
    });
  });
});
