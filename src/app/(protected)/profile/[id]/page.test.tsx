import { Mock } from 'vitest';

import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen } from '@/test/utilities';

import { getUserProfile } from '@/actions/user';
import { formatDatetime } from '@/utils/formatter';

import ProfilePage from './page';

vi.mock('@/actions/user', () => ({
  getUserProfile: vi.fn(),
}));

// Child components are covered by their own tests; render lightweight markers
// here and capture the props the page wires through to them.
const propsSpy = {
  layout: undefined as unknown,
};

vi.mock('@/components/PageTitle', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../_components/ProfileLayout', () => ({
  default: (props: unknown) => {
    propsSpy.layout = props;
    return <div>ProfileLayout</div>;
  },
}));

describe('ProfilePage', () => {
  const mockGetUserProfile = getUserProfile as unknown as Mock;

  const setup = async ({
    id = MOCK_USER.id,
    targetUser = MOCK_USER,
    viewOnly = false,
  } = {}) => {
    mockGetUserProfile.mockResolvedValue({ targetUser, viewOnly });

    return renderWithUI(
      await ProfilePage({ params: Promise.resolve({ id }) }),
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    propsSpy.layout = undefined;
  });

  test('renders the page title and layout', async () => {
    await setup();

    expect(screen.getByText('Profile Details')).toBeInTheDocument();
    expect(screen.getByText('ProfileLayout')).toBeInTheDocument();
  });

  test('fetches the profile for the requested id', async () => {
    await setup({ id: 'user-456' });

    expect(mockGetUserProfile).toHaveBeenCalledWith('user-456');
  });

  test('passes the fetched user and viewOnly flag to the layout', async () => {
    await setup({ viewOnly: true });

    expect(propsSpy.layout).toEqual({ user: MOCK_USER, viewOnly: true });
  });

  test('shows when the profile was last updated', async () => {
    await setup();

    expect(
      screen.getByText(`Last updated on ${formatDatetime(MOCK_USER.updatedAt)}`),
    ).toBeInTheDocument();
  });
});
