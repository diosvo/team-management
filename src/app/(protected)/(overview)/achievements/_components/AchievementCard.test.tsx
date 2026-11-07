import { removeAchievement } from '@/actions/achievement';
import type { AchievementWithRelations } from '@/db/achievement';
import usePermissions from '@/hooks/use-permissions';
import {
  MOCK_ACHIEVEMENT_PLAYER,
  MOCK_ACHIEVEMENT_WITH_RELATIONS,
} from '@/test/mocks/achievement';
import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_PLAYER, MOCK_USER } from '@/test/mocks/user';
import {
  createPermissionsMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import AchievementCard from './AchievementCard';
import { UpsertAchievement } from './UpsertAchievement';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/achievement', () => ({
  removeAchievement: vi.fn(),
}));

// The dialog is exercised by its own test; stub the overlay controller so we
// can assert the card opens it in "Update" mode.
vi.mock('./UpsertAchievement', () => ({
  UpsertAchievement: { open: vi.fn() },
}));

const achievement: AchievementWithRelations = {
  ...MOCK_ACHIEVEMENT_WITH_RELATIONS,
  // Distinct from the "Champion" type badge so queries are unambiguous.
  title: 'Summer Champions',
};

describe('AchievementCard', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockOpen = vi.mocked(UpsertAchievement.open);

  const setup = (
    item = achievement,
    { canManage = false }: { canManage?: boolean } = {},
  ) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        can: vi.fn(() => canManage),
      }),
    );

    return renderWithUI(<AchievementCard achievement={item} />);
  };

  setupTestLifecycle();

  test('renders the title, type icon and league period', () => {
    setup();

    expect(screen.getByText(achievement.title)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Champion' })).toBeInTheDocument();
    expect(
      screen.getByText(`${MOCK_LEAGUE.name} • 01/01/2024 – 31/12/2024`),
    ).toBeInTheDocument();
  });

  test('renders a standalone caption when there is no league', () => {
    setup({ ...achievement, league_id: null, league: null });

    expect(screen.getByText('Standalone honor')).toBeInTheDocument();
  });

  test('names the awarded player instead of the league for individual honors', () => {
    setup({
      ...achievement,
      player_id: MOCK_PLAYER.id,
      player: MOCK_ACHIEVEMENT_PLAYER,
    });

    expect(screen.getByText(new RegExp(MOCK_USER.name))).toBeInTheDocument();
    expect(
      screen.queryByText(new RegExp(MOCK_LEAGUE.name)),
    ).not.toBeInTheDocument();
  });

  // The actions only surface on hover (desktop) and are dropped on mobile, so
  // jsdom sees them as `display: none` and needs `hidden` to reach them.
  const action = (name: RegExp) =>
    screen.queryByRole('button', { name, hidden: true });

  test('hides the edit and delete actions without permission', () => {
    setup();

    expect(action(/edit achievement/i)).not.toBeInTheDocument();
    expect(action(/delete achievement/i)).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode when the edit button is clicked', async () => {
    const { user } = setup(achievement, { canManage: true });

    await user.click(action(/edit achievement/i)!);

    expect(mockOpen).toHaveBeenCalledWith('update-achievement', {
      action: 'Update',
      item: {
        achievement_id: achievement.achievement_id,
        type: achievement.type,
        title: achievement.title,
        year: achievement.year,
        league_id: achievement.league_id,
        player_id: achievement.player_id,
        description: achievement.description,
      },
    });
  });

  test('deletes the achievement when the delete button is clicked', async () => {
    vi.mocked(removeAchievement).mockResolvedValue({
      success: true,
      message: 'Deleted achievement successfully',
    });

    const { user } = setup(achievement, { canManage: true });

    await user.click(action(/delete achievement/i)!);

    await waitFor(() => {
      expect(removeAchievement).toHaveBeenCalledWith(
        achievement.achievement_id,
      );
    });
  });

  test('shows an error toast when deleting fails', async () => {
    vi.mocked(removeAchievement).mockResolvedValue({
      success: false,
      message: 'Delete failed',
    });

    const { user } = setup(achievement, { canManage: true });

    await user.click(action(/delete achievement/i)!);

    await waitFor(() => {
      expect(removeAchievement).toHaveBeenCalledWith(
        achievement.achievement_id,
      );
    });
  });
});
