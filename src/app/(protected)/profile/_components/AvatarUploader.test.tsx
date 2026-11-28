import { uploadAvatar } from '@/actions/user';
import { useUserAvatar } from '@/hooks/use-image';
import usePermissions from '@/hooks/use-permissions';
import { useSessionContext } from '@/providers/session';
import { MOCK_SESSION_USER, MOCK_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  createSessionMock,
  createSWRMock,
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import AvatarUploader from './AvatarUploader';

vi.mock('@/actions/user', () => ({
  uploadAvatar: vi.fn(),
}));

vi.mock('@/hooks/use-image', () => ({
  useUserAvatar: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

vi.mock('@/providers/session', () => ({
  useSessionContext: vi.fn(),
}));

const mockRefetch = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  default: {
    useSession: vi.fn(() => ({ refetch: mockRefetch })),
  },
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

import { toaster } from '@/components/ui/toaster';

const IMAGE = 'data:image/png;base64,abc';

describe('AvatarUploader', () => {
  setupTestLifecycle();

  const mockUploadAvatar = vi.mocked(uploadAvatar);

  const setup = ({
    isOwner = true,
    isAdmin = false,
    image = undefined as string | undefined,
    isLoading = false,
  } = {}) => {
    vi.mocked(useUserAvatar).mockReturnValue(
      createSWRMock<Nullable<string>>({ data: image, isLoading }),
    );
    vi.mocked(useSessionContext).mockReturnValue(
      createSessionMock({
        user: {
          ...MOCK_SESSION_USER,
          id: isOwner ? MOCK_USER.id : 'someone-else',
        },
      }),
    );
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ isAdmin }),
    );

    return renderWithUI(<AvatarUploader user={MOCK_USER} />);
  };

  const getFileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;

  const openMenu = async (user: ReturnType<typeof setup>['user']) =>
    user.click(screen.getByRole('button', { name: 'Profile picture options' }));

  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

  test('should be accessible', async () => {
    const { container } = setup({ image: IMAGE });

    await expectNoA11yViolations(container);
  });

  test('shows a skeleton while the avatar loads', () => {
    setup({ isLoading: true });

    expect(
      screen.queryByRole('button', { name: 'Profile picture options' }),
    ).not.toBeInTheDocument();
  });

  test('requests the avatar through the hook', () => {
    setup({ image: IMAGE });

    expect(useUserAvatar).toHaveBeenCalledWith(MOCK_USER.image);
  });

  describe('owner', () => {
    test('offers both actions when there is a picture', async () => {
      const { user } = setup({ image: IMAGE });

      await openMenu(user);

      expect(
        await screen.findByRole('menuitem', { name: 'See profile picture' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Choose profile picture' }),
      ).toBeInTheDocument();
    });

    test('only offers to choose a picture when there is none', async () => {
      const { user } = setup();

      await openMenu(user);

      expect(
        await screen.findByRole('menuitem', { name: 'Choose profile picture' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: 'See profile picture' }),
      ).not.toBeInTheDocument();
    });

    test('opens the preview from the menu', async () => {
      const { user } = setup({ image: IMAGE });

      await openMenu(user);
      await user.click(
        await screen.findByRole('menuitem', { name: 'See profile picture' }),
      );

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('opens the file picker from the menu', async () => {
      const { container, user } = setup();
      const click = vi.spyOn(getFileInput(container), 'click');

      await openMenu(user);
      await user.click(
        await screen.findByRole('menuitem', { name: 'Choose profile picture' }),
      );

      await waitFor(() => expect(click).toHaveBeenCalled());
    });

    test('uploads the avatar and refreshes the session on success', async () => {
      mockUploadAvatar.mockResolvedValue({
        success: true,
        message: 'Uploaded avatar successfully',
        data: { image: 'users/user-123/avatar-xyz.png' },
      });

      const { container, user } = setup();

      await user.upload(getFileInput(container), file);

      await waitFor(() => {
        expect(mockUploadAvatar).toHaveBeenCalledWith(
          MOCK_USER.id,
          MOCK_USER.image,
          file,
        );
      });
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'loading' }),
      );
      await waitFor(() => {
        expect(toaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'success' }),
        );
      });
      expect(mockRefetch).toHaveBeenCalledWith({
        query: { disableCookieCache: true },
      });
    });

    test('does not refresh the session when the upload fails', async () => {
      mockUploadAvatar.mockResolvedValue({
        success: false,
        message: 'Upload failed',
      });

      const { container, user } = setup();

      await user.upload(getFileInput(container), file);

      await waitFor(() => {
        expect(toaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'error' }),
        );
      });
      expect(mockRefetch).not.toHaveBeenCalled();
    });

    test('warns about a rejected file', async () => {
      const { container, user } = setup();
      const bigFile = new File(
        [new Uint8Array(10 * 1024 * 1024 + 1)],
        'big.png',
        { type: 'image/png' },
      );

      await user.upload(getFileInput(container), bigFile);

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Image must be smaller than 10 MB',
          }),
        );
      });
      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });
  });

  describe('admin on another profile', () => {
    test('uploads without refreshing their own session', async () => {
      mockUploadAvatar.mockResolvedValue({
        success: true,
        message: 'Uploaded avatar successfully',
        data: { image: 'users/user-123/avatar-xyz.png' },
      });

      const { container, user } = setup({ isOwner: false, isAdmin: true });

      expect(
        screen.getByRole('button', { name: 'Profile picture options' }),
      ).toBeInTheDocument();

      await user.upload(getFileInput(container), file);

      await waitFor(() => {
        expect(toaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'success' }),
        );
      });
      expect(mockRefetch).not.toHaveBeenCalled();
    });
  });

  describe('other members', () => {
    test('open the picture in a preview', async () => {
      const { container, user } = setup({ isOwner: false, image: IMAGE });

      expect(getFileInput(container)).toBeNull();

      await user.click(
        screen.getByRole('button', { name: 'See profile picture' }),
      );

      const dialog = await screen.findByRole('dialog');
      expect(dialog.querySelector('img')).toHaveAttribute('src', IMAGE);
    });

    test('see a plain avatar when there is no picture', () => {
      setup({ isOwner: false });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
