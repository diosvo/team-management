import { Mock } from 'vitest';

import { MOCK_PLAYER, MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import { fireEvent, renderWithUI, screen, waitFor } from '@/test/utilities';

import { updateTeamInfo } from '@/actions/user';
import usePermissions from '@/hooks/use-permissions';
import { UserState } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';

import TeamInfo from './TeamInfo';

const { mockMutate } = vi.hoisted(() => ({ mockMutate: vi.fn() }));

vi.mock('@/actions/user', () => ({
  updateTeamInfo: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('swr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('swr')>();
  return {
    ...actual,
    useSWRConfig: () => ({ mutate: mockMutate }),
  };
});

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

describe('TeamInfo', () => {
  const mockUpdateTeamInfo = updateTeamInfo as unknown as Mock;
  const mockUsePermissions = usePermissions as unknown as Mock;

  const setup = ({
    viewOnly = false,
    isAdmin = false,
    isPlayer = true,
    isCoach = false,
  } = {}) => {
    mockUsePermissions.mockReturnValue({ isAdmin, isPlayer, isCoach });

    return renderWithUI(
      <TeamInfo user={MOCK_USER_WITH_PLAYER} viewOnly={viewOnly} />,
    );
  };

  const enterEditMode = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button'));
    return screen.findByDisplayValue(MOCK_USER_WITH_PLAYER.join_date!);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the stored team details for a player', () => {
    setup();

    expect(screen.getByText(MOCK_USER_WITH_PLAYER.role)).toBeInTheDocument();
    expect(screen.getByText(String(MOCK_PLAYER.position))).toBeInTheDocument();
    expect(screen.getByText(MOCK_USER_WITH_PLAYER.state)).toBeInTheDocument();
    expect(
      screen.getByText(String(MOCK_PLAYER.jersey_number)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDate(MOCK_USER_WITH_PLAYER.join_date), {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  test('disables editing when viewOnly is set', () => {
    setup({ viewOnly: true });

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('reveals the editable fields when editing', async () => {
    const { user } = setup();

    const joinDate = await enterEditMode(user);

    expect(joinDate).toBeInTheDocument();
    // Non-admins cannot change the role, so it stays read-only.
    expect(screen.getByText(MOCK_USER_WITH_PLAYER.role)).toBeInTheDocument();
  });

  test('submits the edited values through updateTeamInfo', async () => {
    mockUpdateTeamInfo.mockResolvedValue({ success: true, message: 'Updated' });

    const { container, user } = setup();

    const joinDate = await enterEditMode(user);
    fireEvent.change(joinDate, { target: { value: '2024-03-01' } });

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpdateTeamInfo).toHaveBeenCalledWith(
        MOCK_USER_WITH_PLAYER.id,
        expect.objectContaining({
          user: expect.objectContaining({ join_date: '2024-03-01' }),
        }),
      );
    });
  });

  test('refreshes the active players cache after activating a member', async () => {
    mockUpdateTeamInfo.mockResolvedValue({ success: true, message: 'Updated' });

    const { container, user } = setup();

    const joinDate = await enterEditMode(user);
    fireEvent.change(joinDate, { target: { value: '2024-03-01' } });

    const submit = container.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // MOCK_USER_WITH_PLAYER is ACTIVE, so the players cache should be revalidated.
    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(MOCK_USER_WITH_PLAYER.state).toBe(UserState.ACTIVE);
  });
});
