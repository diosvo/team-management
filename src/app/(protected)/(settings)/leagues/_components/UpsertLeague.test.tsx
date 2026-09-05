import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  withFreshSWR,
} from '@/test/utilities';

import { LeagueStatus } from '@/utils/enum';

import { getPlayersInLeague, upsertLeague } from '@/actions/league';

import { UpsertLeague } from './UpsertLeague';

vi.mock('@/actions/league', () => ({
  upsertLeague: vi.fn(),
  getPlayersInLeague: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// The player pickers have their own tests; expose a button that selects a
// known player so the submitted ids can be asserted.
vi.mock('@/components/user/PlayerSelection', () => ({
  PlayerSelection: ({
    onSelectionChange,
  }: {
    onSelectionChange: (players: Array<unknown>) => void;
  }) => (
    <button
      type="button"
      onClick={() => onSelectionChange([MOCK_USER_WITH_PLAYER])}
    >
      PlayerSelection
    </button>
  ),
  SelectedPlayers: ({ selection }: { selection: Array<{ id: string }> }) => (
    <div data-testid="selected-players">{selection.length}</div>
  ),
}));

describe('UpsertLeague', () => {
  const mockUpsertLeague = vi.mocked(upsertLeague);
  const mockGetPlayersInLeague = vi.mocked(getPlayersInLeague);

  // The date inputs carry `min={ESTABLISHED_DATE}`; anything earlier fails
  // HTML constraint validation and never reaches the submit handler.
  const UPCOMING_LEAGUE = {
    league_id: MOCK_LEAGUE.league_id,
    name: MOCK_LEAGUE.name,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    description: MOCK_LEAGUE.description,
    status: LeagueStatus.UPCOMING,
  };

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { league_id: '' },
  ) => {
    const view = renderWithUI(withFreshSWR(<UpsertLeague.Viewport />));

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-league' : 'add-league';
    await act(async () => {
      UpsertLeague.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  beforeEach(() => {
    mockGetPlayersInLeague.mockResolvedValue([]);
  });

  afterEach(() => {
    act(() => {
      UpsertLeague.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add League')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  test('keeps the submit button disabled until the form is valid', async () => {
    await open('Add');

    const submit = await screen.findByRole('button', { name: /add/i });

    expect(submit).toBeDisabled();
  });

  test('enables the submit button for an already valid league', async () => {
    const { user } = await open('Update', UPCOMING_LEAGUE);

    const name = await screen.findByPlaceholderText('Basketball League');
    await user.type(name, '!');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /update/i })).toBeEnabled(),
    );
  });

  test('loads the players already in the league when updating', async () => {
    mockGetPlayersInLeague.mockResolvedValue([MOCK_USER_WITH_PLAYER]);

    await open('Update', UPCOMING_LEAGUE);

    await waitFor(() => {
      expect(mockGetPlayersInLeague).toHaveBeenCalledWith(
        UPCOMING_LEAGUE.league_id,
      );
    });
    expect(await screen.findByTestId('selected-players')).toHaveTextContent('1');
  });

  test('does not fetch the league players when adding', async () => {
    await open('Add');

    await screen.findByText('Add League');

    expect(mockGetPlayersInLeague).not.toHaveBeenCalled();
  });

  test('submits the entered values and the selected players', async () => {
    mockUpsertLeague.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', UPCOMING_LEAGUE);

    const name = await screen.findByPlaceholderText('Basketball League');
    await user.type(name, ' Updated');

    await user.click(screen.getByRole('button', { name: 'PlayerSelection' }));

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertLeague).toHaveBeenCalledWith(
        UPCOMING_LEAGUE.league_id,
        expect.objectContaining({ name: `${UPCOMING_LEAGUE.name} Updated` }),
        [MOCK_USER_WITH_PLAYER.id],
      );
    });
  });

  describe('readonly mode', () => {
    const ENDED_LEAGUE = { ...UPCOMING_LEAGUE, status: LeagueStatus.ENDED };

    test('marks a league that is no longer upcoming as readonly', async () => {
      await open('Update', ENDED_LEAGUE);

      expect(await screen.findByText('Readonly')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Basketball League'),
      ).toBeDisabled();
    });

    test('hides the submit button in readonly mode', async () => {
      await open('Update', ENDED_LEAGUE);

      await screen.findByText('Readonly');

      expect(
        screen.queryByRole('button', { name: /update/i }),
      ).not.toBeInTheDocument();
    });

    test('never marks the add action as readonly', async () => {
      await open('Add');

      await screen.findByText('Add League');

      expect(screen.queryByText('Readonly')).not.toBeInTheDocument();
    });
  });
});
