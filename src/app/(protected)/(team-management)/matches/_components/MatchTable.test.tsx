import { MOCK_MATCH_RESPONSE } from '@/test/mocks/match';
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
import type { MatchWithTeams } from '@/types/match';

import { removeMatch } from '@/actions/match';

import MatchTable from './MatchTable';
import { UpsertMatch } from './UpsertMatch';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/match', () => ({
  removeMatch: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertMatch', () => ({
  UpsertMatch: { open: vi.fn(), Viewport: () => null },
}));

describe('MatchTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveMatch = vi.mocked(removeMatch);
  const mockOpen = vi.mocked(UpsertMatch.open);

  const [LOSS_MATCH, WIN_MATCH] = MOCK_MATCH_RESPONSE.data as Array<
    unknown
  > as Array<MatchWithTeams>;

  // Both fixtures share an opponent; give one its own name so the search
  // filter has something to discriminate on.
  const AWAY_MATCH: MatchWithTeams = {
    ...WIN_MATCH,
    match_id: 'match-3',
    away_team: { team_id: 'team-999', name: 'Hanoi Buffaloes' },
  };

  const setup = ({
    matches = [LOSS_MATCH, AWAY_MATCH],
    can = () => false,
    params = {},
  }: Partial<{
    matches: Array<MatchWithTeams>;
    can: PermissionsResult['can'];
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can }));
    mockUseQueryStates({ page: 1, q: '', ...params });

    return renderWithUI(<MatchTable matches={matches} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each match', () => {
    setup();

    expect(screen.getByText(LOSS_MATCH.away_team.name)).toBeInTheDocument();
    expect(screen.getByText(AWAY_MATCH.away_team.name)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Opponent', 'League', 'Score', 'Result', 'Location', 'Date'].forEach(
      (header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      },
    );
  });

  test('renders the score and the result of a match', () => {
    setup({ matches: [LOSS_MATCH] });

    expect(
      screen.getByText(
        `${LOSS_MATCH.home_team_score} - ${LOSS_MATCH.away_team_score}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(LOSS_MATCH.result)).toBeInTheDocument();
  });

  test('shows the empty state when there are no matches', () => {
    setup({ matches: [] });

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  test('filters the matches by the opponent name', () => {
    setup({ params: { q: 'hanoi' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Hanoi', { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText(LOSS_MATCH.away_team.name),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode with the opponent flattened to its id', async () => {
    const { user } = setup();

    await user.click(screen.getByText(AWAY_MATCH.away_team.name));

    expect(mockOpen).toHaveBeenCalledWith('update-match', {
      action: 'Update',
      item: { ...AWAY_MATCH, away_team: AWAY_MATCH.away_team.team_id },
    });
  });

  describe('selection', () => {
    const canDelete: PermissionsResult['can'] = (_, action) =>
      action === 'delete';

    test('deletes the selected matches and reports success', async () => {
      mockRemoveMatch.mockResolvedValue({ success: true, message: 'Removed' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveMatch.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([LOSS_MATCH.match_id, AWAY_MATCH.match_id]),
        );
      });

      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveMatch
        .mockResolvedValueOnce({ success: true, message: 'Removed' })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

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
