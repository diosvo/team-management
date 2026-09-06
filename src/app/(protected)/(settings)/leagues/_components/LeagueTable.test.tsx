import { MOCK_LEAGUE } from '@/test/mocks/league';
import {
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import usePermissions, {
  type PermissionsResult,
} from '@/hooks/use-permissions';
import { AchievementType, LeagueStatus } from '@/utils/enum';

import { removeLeague } from '@/actions/league';
import type { League } from '@/drizzle/schema';

import LeagueTable from './LeagueTable';
import { UpsertLeague } from './UpsertLeague';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/league', () => ({
  removeLeague: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertLeague', () => ({
  UpsertLeague: { open: vi.fn(), Viewport: () => null },
}));

type LeagueRow = League & {
  player_count: number;
  achievement_type: Array<AchievementType>;
};

describe('LeagueTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveLeague = vi.mocked(removeLeague);
  const mockOpen = vi.mocked(UpsertLeague.open);

  const buildLeague = (overrides: Partial<LeagueRow> = {}): LeagueRow => ({
    ...MOCK_LEAGUE,
    player_count: 5,
    achievement_type: [],
    ...overrides,
  });

  // Ended in the past, so the achievement shortcut can render.
  const endedLeague = buildLeague({
    achievement_type: [AchievementType.CHAMPION],
  });
  const upcomingLeague = buildLeague({
    league_id: 'league-456',
    name: 'Winter League',
    status: LeagueStatus.UPCOMING,
    start_date: '2099-01-01',
    end_date: '2099-12-31',
    player_count: 8,
  });

  const setup = ({
    leagues = [endedLeague, upcomingLeague],
    can = () => false,
    isGuest = false,
    params = {},
  }: Partial<{
    leagues: Array<LeagueRow>;
    can: PermissionsResult['can'];
    isGuest: boolean;
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can, isGuest }));
    mockUseQueryStates({ page: 1, q: '', status: [], ...params });

    return renderWithUI(<LeagueTable leagues={leagues} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each league', () => {
    setup();

    expect(screen.getByText(endedLeague.name)).toBeInTheDocument();
    expect(screen.getByText(upcomingLeague.name)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'No. Players', 'Start Date', 'End Date', 'Status'].forEach(
      (header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      },
    );
  });

  test('renders the player count and a capitalized status badge', () => {
    setup({ leagues: [upcomingLeague] });

    expect(screen.getByText(String(upcomingLeague.player_count))).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  test('shows the empty state when there are no leagues', () => {
    setup({ leagues: [] });

    expect(screen.getByText('No leagues found')).toBeInTheDocument();
  });

  test('filters the leagues by the search query', () => {
    setup({ params: { q: 'winter' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Winter', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(endedLeague.name)).not.toBeInTheDocument();
  });

  test('filters the leagues by status', () => {
    setup({ params: { status: [LeagueStatus.UPCOMING] } });

    expect(screen.getByText(upcomingLeague.name)).toBeInTheDocument();
    expect(screen.queryByText(endedLeague.name)).not.toBeInTheDocument();
  });

  describe('achievement shortcut', () => {
    test('links to the achievements page for an ended league', () => {
      setup({ leagues: [endedLeague], can: () => true });

      expect(screen.getByRole('link')).toHaveAttribute(
        'href',
        `/achievements?record=${endedLeague.league_id}`,
      );
    });

    test('is hidden when the user cannot create achievements', () => {
      setup({ leagues: [endedLeague], can: () => false });

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('is hidden for a league that has not ended', () => {
      setup({ leagues: [upcomingLeague], can: () => true });

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('is hidden when the league has no achievement type', () => {
      setup({
        leagues: [buildLeague({ achievement_type: [] })],
        can: () => true,
      });

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  describe('row click', () => {
    test('opens the dialog in update mode', async () => {
      const { user } = setup();

      await user.click(screen.getByText(upcomingLeague.name));

      expect(mockOpen).toHaveBeenCalledWith('update-league', {
        action: 'Update',
        item: upcomingLeague,
      });
    });

    test('does nothing for a guest', async () => {
      const { user } = setup({ isGuest: true });

      await user.click(screen.getByText(upcomingLeague.name));

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    const canDelete: PermissionsResult['can'] = (_, action) =>
      action === 'delete';

    test('deletes the selected leagues and reports success', async () => {
      mockRemoveLeague.mockResolvedValue({ success: true, message: 'Removed' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Only Upcoming leagues are selectable.
      await waitFor(() => {
        expect(mockRemoveLeague).toHaveBeenCalledWith(upcomingLeague.league_id);
      });
      expect(mockRemoveLeague).toHaveBeenCalledTimes(1);

      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when a deletion fails', async () => {
      mockRemoveLeague.mockResolvedValue({ success: false, message: 'nope' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockToaster.update).toHaveBeenCalledWith(
          'toast-id',
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
