import { Mock } from 'vitest';

import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { uploadAvatar } from '@/actions/user';
import { useUserAvatar } from '@/hooks/use-avatar';
import { useSessionContext } from '@/providers/session';

import { toaster } from '@/components/ui/toaster';

import AvatarUploader from './AvatarUploader';

vi.mock('@/actions/user', () => ({
  uploadAvatar: vi.fn(),
}));

vi.mock('@/hooks/use-avatar', () => ({
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

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

describe('AvatarUploader', () => {
  const mockUploadAvatar = uploadAvatar as unknown as Mock;
  const mockUseUserAvatar = useUserAvatar as unknown as Mock;
  const mockUseSessionContext = useSessionContext as unknown as Mock;

  const setup = ({
    isOwner = true,
    image = undefined as string | undefined,
    user = MOCK_USER,
  } = {}) => {
    mockUseUserAvatar.mockReturnValue({ data: image });
    mockUseSessionContext.mockReturnValue({
      user: isOwner ? { id: user.id } : { id: 'someone-else' },
    });

    return renderWithUI(<AvatarUploader user={user} />);
  };

  const getFileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;

  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the user name and role', () => {
    setup();

    expect(screen.getByText(MOCK_USER.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_USER.role)).toBeInTheDocument();
  });

  test('renders the avatar image resolved by the hook', () => {
    setup({ image: 'data:image/png;base64,abc' });

    expect(mockUseUserAvatar).toHaveBeenCalledWith(MOCK_USER.image);
  });

  test('disables the file input for non-owners', () => {
    const { container } = setup({ isOwner: false });

    expect(getFileInput(container)).toBeDisabled();
  });

  test('enables the file input for the profile owner', () => {
    const { container } = setup({ isOwner: true });

    expect(getFileInput(container)).toBeEnabled();
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
