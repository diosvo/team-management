import { Mock } from 'vitest';

import { removeAchievement } from '@/actions/achievement';
import usePermissions from '@/hooks/use-permissions';

import { MOCK_ACHIEVEMENT } from '@/test/mocks/achievement';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { AchievementWithRelations } from '@/db/achievement';

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
  ...MOCK_ACHIEVEMENT,
  // Distinct from the "Champion" type badge so queries are unambiguous.
  title: 'Summer Champions',
  league: {
    name: 'Summer League',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
  },
  player: null,
};

describe('AchievementCard', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockOpen = UpsertAchievement.open as unknown as Mock;

  const setup = (
    item = achievement,
    { canManage = false }: { canManage?: boolean } = {},
  ) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => canManage),
    });

    return renderWithUI(<AchievementCard achievement={item} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the title, type icon and league period', () => {
    setup();

    expect(screen.getByText('Summer Champions')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Champion' })).toBeInTheDocument();
    expect(
      screen.getByText('Summer League • 01/01/2024 – 31/12/2024'),
    ).toBeInTheDocument();
  });

  test('renders a standalone caption when there is no league', () => {
    setup({ ...achievement, league_id: null, league: null });

    expect(screen.getByText('Standalone honor')).toBeInTheDocument();
  });

  test('names the awarded player instead of the league for individual honors', () => {
    setup({
      ...achievement,
      player_id: 'player-123',
      player: {
        id: 'player-123',
        user: { id: 'player-123', name: 'Player Name', image: null },
      },
    });

    expect(screen.getByText(/Player Name/)).toBeInTheDocument();
    expect(screen.queryByText(/Summer League/)).not.toBeInTheDocument();
  });

  test('hides the edit and delete actions without permission', () => {
    setup();

    expect(
      screen.queryByRole('button', { name: /edit achievement/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete achievement/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode when the edit button is clicked', async () => {
    const { user } = setup(achievement, { canManage: true });

    await user.click(
      screen.getByRole('button', { name: /edit achievement/i }),
    );

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

    await user.click(
      screen.getByRole('button', { name: /delete achievement/i }),
    );

    await waitFor(() => {
      expect(removeAchievement).toHaveBeenCalledWith(
        achievement.achievement_id,
      );
    });
  });
});
