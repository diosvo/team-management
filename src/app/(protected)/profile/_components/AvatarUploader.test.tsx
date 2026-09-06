import { MOCK_SESSION_USER, MOCK_USER } from '@/test/mocks/user';
import {
  createSessionMock,
  createSWRMock,
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { uploadAvatar } from '@/actions/user';
import { useUserAvatar } from '@/hooks/use-image';
import { useSessionContext } from '@/providers/session';

import { toaster } from '@/components/ui/toaster';

import AvatarUploader from './AvatarUploader';

vi.mock('@/actions/user', () => ({
  uploadAvatar: vi.fn(),
}));

vi.mock('@/hooks/use-image', () => ({
  useUserAvatar: vi.fn(),
}));

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

describe('AvatarUploader', () => {
  setupTestLifecycle();

  const mockUploadAvatar = vi.mocked(uploadAvatar);
  const mockUseUserAvatar = vi.mocked(useUserAvatar);
  const mockUseSessionContext = vi.mocked(useSessionContext);

  const setup = ({
    isOwner = true,
    image = undefined as string | undefined,
    user = MOCK_USER,
  } = {}) => {
    mockUseUserAvatar.mockReturnValue(
      createSWRMock<Nullable<string>>({ data: image }),
    );
    mockUseSessionContext.mockReturnValue(
      createSessionMock({
        user: { ...MOCK_SESSION_USER, id: isOwner ? user.id : 'someone-else' },
      }),
    );

    return renderWithUI(<AvatarUploader user={user} />);
  };

  const getFileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;

  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the user name and role', async () => {
    setup();

    await waitFor(() => {
      // The name appears twice: the avatar fallback and the profile label.
      expect(screen.getAllByText(MOCK_USER.name).length).toBeGreaterThan(0);
      expect(screen.getByText(MOCK_USER.role)).toBeInTheDocument();
    });
  });

  test('renders the avatar image resolved by the hook', async () => {
    setup({ image: 'data:image/png;base64,abc' });

    await waitFor(() => {
      expect(mockUseUserAvatar).toHaveBeenCalledWith(MOCK_USER.image);
    });
  });

  test('disables the file input for non-owners', async () => {
    const { container } = setup({ isOwner: false });

    await waitFor(() => {
      expect(getFileInput(container)).toBeDisabled();
    });
  });

  test('enables the file input for the profile owner', async () => {
    const { container } = setup({ isOwner: true });

    await waitFor(() => {
      expect(getFileInput(container)).toBeEnabled();
    });
  });

  test('uploads the avatar and refreshes the session on success', async () => {
    const uploadedPath = 'users/user-123/avatar-xyz.png';
    mockUploadAvatar.mockResolvedValue({
      success: true,
      message: 'Uploaded avatar successfully',
      data: { image: uploadedPath },
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
});
