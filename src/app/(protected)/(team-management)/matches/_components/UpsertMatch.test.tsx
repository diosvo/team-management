import {
  act,
  createPermissionsMock,
  createToasterMock,
  expectNoA11yViolations,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import { upsertMatch } from '@/actions/match';

import { UpsertMatch } from './UpsertMatch';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/match', () => ({
  upsertMatch: vi.fn(),
}));

vi.mock('@/actions/league', () => ({
  getLeagues: vi.fn(),
}));

vi.mock('@/actions/team', () => ({
  getTeams: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

// The pickers fetch their own options and are covered by their own tests; the
// form keeps the ids it was opened with.
vi.mock('@/components/SearchableSelect', () => ({
  SearchableSelectField: ({ name }: { name: string }) => (
    <div data-testid={`select-${name}`} />
  ),
}));

vi.mock('@/components/common/LocationSelection', () => ({
  default: () => <div data-testid="location-selection" />,
}));

describe('UpsertMatch', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockUpsertMatch = vi.mocked(upsertMatch);

  // The schema demands uuids for the team/league ids.
  const AWAY_TEAM_ID = '11111111-1111-4111-8111-111111111111';
  const LEAGUE_ID = '22222222-2222-4222-8222-222222222222';

  const EXISTING_MATCH = {
    match_id: 'match-123',
    away_team: AWAY_TEAM_ID,
    league_id: LEAGUE_ID,
    location_id: null,
    date: '2026-01-15',
    time: '19:00:00',
    home_team_score: 40,
    away_team_score: 35,
    is_5x5: true,
  };

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { match_id: '' },
    canEdit = true,
  ) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ can: () => canEdit }),
    );

    const view = renderWithUI(<UpsertMatch.Viewport />);

    // Match the id the component closes on submit for the "Update" action.
    const id = action === 'Update' ? 'update-match' : 'add-match';
    await act(async () => {
      UpsertMatch.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertMatch.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add result')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Our Score')).toBeInTheDocument();
    expect(screen.getByText('Their Score')).toBeInTheDocument();
  });

  test('renders the opponent and location pickers', async () => {
    await open('Add');

    expect(await screen.findByTestId('select-away_team')).toBeInTheDocument();
    expect(screen.getByTestId('location-selection')).toBeInTheDocument();
  });

  test('shows the last updated timestamp when the match has one', async () => {
    await open('Update', {
      ...EXISTING_MATCH,
      updated_at: new Date('2026-02-01T10:00:00Z'),
    });

    expect(await screen.findByText(/Last updated on/)).toBeInTheDocument();
  });

  describe('league match toggle', () => {
    test('starts on and reveals the league picker when the match has a league', async () => {
      await open('Update', EXISTING_MATCH);

      expect(await screen.findByTestId('select-league_id')).toBeVisible();
    });

    test('starts off when the match has no league', async () => {
      await open('Update', { ...EXISTING_MATCH, league_id: null });

      await screen.findByText('Update result');

      // Visibility keeps the picker mounted but hidden.
      expect(screen.getByTestId('select-league_id')).not.toBeVisible();
    });

    test('reveals the league picker once toggled on', async () => {
      const { user } = await open('Update', {
        ...EXISTING_MATCH,
        league_id: null,
      });

      await user.click(await screen.findByText('League Match'));

      await waitFor(() =>
        expect(screen.getByTestId('select-league_id')).toBeVisible(),
      );
    });

    test('hides the league picker from a user who cannot edit', async () => {
      await open('Update', EXISTING_MATCH, false);

      await screen.findByText('Update result');

      expect(screen.queryByTestId('select-league_id')).not.toBeInTheDocument();
    });
  });

  test('submits the match through upsertMatch', async () => {
    mockUpsertMatch.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', EXISTING_MATCH);

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertMatch).toHaveBeenCalledWith(
        EXISTING_MATCH.match_id,
        expect.objectContaining({
          away_team: AWAY_TEAM_ID,
          league_id: LEAGUE_ID,
          date: EXISTING_MATCH.date,
        }),
      );
    });
  });

  test('clears the league when the match is not a league match', async () => {
    mockUpsertMatch.mockResolvedValue({ success: true, message: 'Saved' });

    const { user } = await open('Update', EXISTING_MATCH);

    await user.click(await screen.findByText('League Match'));

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertMatch).toHaveBeenCalledWith(
        EXISTING_MATCH.match_id,
        expect.objectContaining({ league_id: null }),
      );
    });
  });

  test('reports a failed save through the toaster', async () => {
    mockUpsertMatch.mockResolvedValue({
      success: false,
      message: 'Match already recorded',
    });

    const { user } = await open('Update', EXISTING_MATCH);

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockToaster.update).toHaveBeenCalledWith(
        'toast-id',
        expect.objectContaining({
          type: 'error',
          title: 'Match already recorded',
        }),
      );
    });
  });
});
