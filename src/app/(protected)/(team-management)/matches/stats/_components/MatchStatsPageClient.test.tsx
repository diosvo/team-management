import { pick } from 'es-toolkit';
import { nth } from 'es-toolkit/compat';

import { getMatchPlayerStats, saveMatchPlayerStats } from '@/actions/match';
import type { MatchPlayerStatsWithName, PlayedMatch } from '@/db/match';
import type { User } from '@/drizzle/schema';
import { MOCK_MATCH } from '@/test/mocks/match';
import { MOCK_AWAY_TEAM } from '@/test/mocks/team';
import { MOCK_ALICE, MOCK_DAN } from '@/test/mocks/user';
import {
  createToasterMock,
  fireEvent,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  within,
} from '@/test/utilities';

import MatchStatsPageClient from './MatchStatsPageClient';
import type { GridPlayer, StatDraft } from './MatchStatsTable';

vi.mock('@/actions/match', () => ({
  getMatchPlayerStats: vi.fn(),
  saveMatchPlayerStats: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

const ACTIVE: Array<User> = [MOCK_ALICE, MOCK_DAN];
// How the grid stub prints Alice: `name#jersey`.
const ALICE_TAG = `${MOCK_ALICE.name}#${MOCK_ALICE.player.jersey_number}`;

// Stand-ins expose the callbacks the client wires up as plain buttons.
vi.mock('@/components/user/PlayerSelection', () => ({
  PlayerSelectionWithActions: ({
    disabled,
    selection,
    onSelectionChange,
  }: {
    disabled: boolean;
    selection: Array<User>;
    onSelectionChange: (selected: Array<User>) => void;
  }) => (
    <div data-testid="selection" data-disabled={disabled}>
      {selection.map(({ id }) => id).join(',')}
      <button onClick={() => onSelectionChange(ACTIVE)}>Select all</button>
      <button onClick={() => onSelectionChange([])}>Clear</button>
    </div>
  ),
}));

vi.mock('./MatchStatsTable', () => ({
  default: ({
    players,
    drafts,
    onChange,
    onRemove,
  }: {
    players: Array<GridPlayer>;
    drafts: Record<string, StatDraft>;
    onChange: (id: string, field: string, value: string) => void;
    onRemove: (id: string) => void;
  }) => (
    <div data-testid="grid">
      {players.map(({ id, name, jersey_number }) => (
        <div key={id} data-testid={`row-${id}`}>
          {name}#{jersey_number ?? '-'}:{drafts[id]?.points_scored}
          <button onClick={() => onRemove(id)}>Remove {id}</button>
        </div>
      ))}
      <button onClick={() => onChange(MOCK_ALICE.id, 'points_scored', '12')}>
        Score p1
      </button>
      <button onClick={() => onChange(MOCK_ALICE.id, 'rebounds', '')}>
        Clear p1
      </button>
      <button onClick={() => onChange('ghost', 'points_scored', '3')}>
        Score ghost
      </button>
    </div>
  ),
}));

const match = (overrides: Partial<PlayedMatch> = {}): PlayedMatch => ({
  ...pick(MOCK_MATCH, [
    'match_id',
    'date',
    'home_team_score',
    'away_team_score',
  ]),
  opponent: MOCK_AWAY_TEAM.name,
  recorded: 2,
  ...overrides,
});

const statRow = (
  overrides: Partial<MatchPlayerStatsWithName> = {},
): MatchPlayerStatsWithName =>
  ({
    player_id: MOCK_ALICE.id,
    player_name: MOCK_ALICE.name,
    points_scored: 10,
    rebounds: null,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    ...overrides,
  }) as MatchPlayerStatsWithName;

describe('MatchStatsPageClient', () => {
  const mockGetStats = vi.mocked(getMatchPlayerStats);
  const mockSave = vi.mocked(saveMatchPlayerStats);

  setupTestLifecycle();

  const MATCHES = [match(), match({ match_id: 'm2', recorded: 0 })];

  const setup = (
    props: Partial<Parameters<typeof MatchStatsPageClient>[0]> = {},
  ) =>
    renderWithUI(
      <MatchStatsPageClient
        matches={MATCHES}
        activePlayers={ACTIVE}
        initialMatch={null}
        initialStats={[]}
        {...props}
      />,
    );

  const saveButton = () => screen.getByRole('button', { name: /Save/ });

  const openOptions = async (user: ReturnType<typeof setup>['user']) => {
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    return document.getElementById(combobox.getAttribute('aria-controls')!)!;
  };

  test('starts with no match, disabled pickers and nothing to save', () => {
    setup();

    expect(screen.getByTestId('selection')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(saveButton()).toBeDisabled();
  });

  test('lists played matches with their box-score badge', async () => {
    const { user } = setup();

    const content = await openOptions(user);

    expect(
      within(content).getAllByText(new RegExp(`· ${MOCK_AWAY_TEAM.name}$`)),
    ).toHaveLength(2);
    expect(within(content).getByText('2 recorded')).toBeInTheDocument();
    expect(within(content).getByText('Not recorded')).toBeInTheDocument();
  });

  test('loads the box score of a picked match and updates the URL', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    mockGetStats.mockResolvedValue([statRow({ player_id: MOCK_DAN.id })]);
    const { user } = setup();

    const content = await openOptions(user);
    await user.click(
      nth(within(content).getAllByRole('option', { hidden: true }), 1)!,
    );

    await waitFor(() =>
      expect(replaceState).toHaveBeenCalledWith(null, '', '?match=m2'),
    );
    expect(mockGetStats).toHaveBeenCalledWith('m2');
    expect(screen.getByTestId(`row-${MOCK_DAN.id}`)).toHaveTextContent(
      `${MOCK_ALICE.name}#-:10`,
    );
  });

  test('ignores a cleared match selection', async () => {
    const { container } = setup({ initialMatch: match() });

    fireEvent.change(container.querySelector('select')!, {
      target: { value: '' },
    });

    await waitFor(() => expect(saveButton()).toBeDisabled());
    expect(mockGetStats).not.toHaveBeenCalled();
  });

  test('seeds the grid from the initial stats with roster jersey numbers', () => {
    setup({
      initialMatch: match(),
      initialStats: [
        statRow(),
        // A stat the DB left empty reads as zero.
        statRow({ player_id: 'gone', points_scored: null as never }),
      ],
    });

    expect(screen.getByTestId(`row-${MOCK_ALICE.id}`)).toHaveTextContent(
      `${ALICE_TAG}:10`,
    );
    expect(screen.getByTestId('row-gone')).toHaveTextContent(':0');
    // Only active players reach the picker.
    expect(screen.getByTestId('selection')).toHaveTextContent(
      new RegExp(`^${MOCK_ALICE.id}`),
    );
  });

  test('adds and drops picked players while keeping inactive rows', async () => {
    const { user } = setup({
      initialMatch: match(),
      initialStats: [
        statRow(),
        statRow({ player_id: 'gone', player_name: 'Old' }),
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Select all' }));

    expect(screen.getByTestId(`row-${MOCK_ALICE.id}`)).toHaveTextContent(
      `${ALICE_TAG}:10`,
    );
    expect(screen.getByTestId(`row-${MOCK_DAN.id}`)).toHaveTextContent(
      `${MOCK_DAN.name}#-:0`,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(
      screen.queryByTestId(`row-${MOCK_ALICE.id}`),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('row-gone')).toBeInTheDocument();
  });

  test('uses the jersey number of newly added players', async () => {
    const { user } = setup({ initialMatch: match() });

    await user.click(screen.getByRole('button', { name: 'Select all' }));

    expect(screen.getByTestId(`row-${MOCK_ALICE.id}`)).toHaveTextContent(
      `${ALICE_TAG}:0`,
    );
  });

  test('saves edited lines and removed players', async () => {
    mockSave.mockResolvedValue({ success: true, message: 'Saved' });
    const { user } = setup({
      initialMatch: match(),
      initialStats: [statRow(), statRow({ player_id: 'gone' })],
    });

    await user.click(screen.getByRole('button', { name: 'Score p1' }));
    await user.click(screen.getByRole('button', { name: 'Clear p1' }));
    await user.click(screen.getByRole('button', { name: 'Score ghost' }));
    await user.click(screen.getByRole('button', { name: 'Remove gone' }));
    await user.click(saveButton());

    await waitFor(() =>
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'success',
        title: 'Saved',
      }),
    );
    expect(mockToaster.create).toHaveBeenCalledWith({
      type: 'loading',
      title: 'Saving box score...',
    });
    expect(mockSave).toHaveBeenCalledWith({
      match_id: MOCK_MATCH.match_id,
      rows: [
        expect.objectContaining({
          player_id: MOCK_ALICE.id,
          points_scored: 12,
          rebounds: 0,
        }),
      ],
      removed_player_ids: ['gone'],
    });
  });

  test('can save a sheet that removed every loaded player', async () => {
    mockSave.mockResolvedValue({ success: false, message: 'Nope' });
    const { user } = setup({
      initialMatch: match(),
      initialStats: [statRow()],
    });

    await user.click(
      screen.getByRole('button', { name: `Remove ${MOCK_ALICE.id}` }),
    );
    await user.click(saveButton());

    await waitFor(() =>
      expect(mockToaster.update).toHaveBeenCalledWith('toast-id', {
        type: 'error',
        title: 'Nope',
      }),
    );
    expect(mockSave).toHaveBeenCalledWith({
      match_id: MOCK_MATCH.match_id,
      rows: [],
      removed_player_ids: [MOCK_ALICE.id],
    });
    // A failed save keeps the loaded rows, so it can be retried.
    // isPending clears on the render after the transition settles.
    await waitFor(() => expect(saveButton()).toBeEnabled());
  });
});
