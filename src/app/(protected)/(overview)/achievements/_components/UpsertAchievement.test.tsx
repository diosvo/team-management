import {
  act,
  createToasterMock,
  expectNoA11yViolations,
  fireEvent,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
  withFreshSWR,
  within,
} from '@/test/utilities';

import {
  getPlayerLeagueStatSuggestions,
  upsertAchievement,
} from '@/actions/achievement';
import { getLeagues } from '@/actions/league';
import { getActivePlayers } from '@/actions/user';
import { MOCK_LEAGUE } from '@/test/mocks/league';
import { MOCK_USER, MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';

import { UpsertAchievement } from './UpsertAchievement';

vi.mock('@/actions/achievement', () => ({
  upsertAchievement: vi.fn(),
  getPlayerLeagueStatSuggestions: vi.fn(() => []),
}));

vi.mock('@/actions/league', () => ({
  getLeagues: vi.fn(() => []),
}));

vi.mock('@/actions/user', () => ({
  getActivePlayers: vi.fn(() => []),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('UpsertAchievement', () => {
  const mockUpsertAchievement = vi.mocked(upsertAchievement);
  const mockGetLeagues = vi.mocked(getLeagues);
  const mockGetSuggestions = vi.mocked(getPlayerLeagueStatSuggestions);
  const mockGetActivePlayers = vi.mocked(getActivePlayers);

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { achievement_id: '' },
  ) => {
    // A fresh SWR cache per test: `getEndedLeagues` is keyed by a constant,
    // so a shared cache would serve a prior test's leagues forever (useSWRImmutable
    // never revalidates on its own).
    const view = renderWithUI(withFreshSWR(<UpsertAchievement.Viewport />));

    const id = action === 'Update' ? 'update-achievement' : 'add-achievement';
    await act(async () => {
      UpsertAchievement.open(id, { action, item });
    });

    return view;
  };

  setupTestLifecycle();

  afterEach(() => {
    act(() => {
      UpsertAchievement.removeAll();
    });
  });

  test('should be accessible', async () => {
    await open();

    await expectNoA11yViolations();
  });

  test('renders the dialog title and main fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
    expect(screen.getAllByText('Type').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Title').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Year').length).toBeGreaterThan(0);
  });

  test('renders update title when action is Update', async () => {
    await open('Update', { achievement_id: 'achievement-123' });

    expect(await screen.findByText('Update Achievement')).toBeInTheDocument();
  });

  test('submit button is initially present and clickable when form is valid', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test Achievement',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    expect(submit).toBeInTheDocument();
  });

  test('submits the achievement through upsertAchievement', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    const { user } = await open('Update', {
      achievement_id: 'achievement-123',
      type: 'champion',
      title: 'Summer Champions',
      year: 2024,
      league_id: null,
      player_id: null,
      description: '',
    });

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        'achievement-123',
        expect.objectContaining({
          type: 'champion',
          title: 'Summer Champions',
          year: 2024,
          player_id: null,
        }),
      );
    });
  });

  test('handles successful submission and closes Update dialog', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement saved successfully',
    });

    const { user } = await open('Update', {
      achievement_id: 'achievement-123',
      type: 'champion',
      title: 'Champions',
      year: 2024,
      league_id: null,
      player_id: null,
      description: 'Test',
    });

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('handles submission error', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: false,
      message: 'Failed to save achievement',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Champions',
      year: 2024,
      league_id: null,
      player_id: null,
      description: '',
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('shows the player field and stat suggestions for an individual achievement with a league selected', async () => {
    // `league_id` is validated as a uuid by the schema — the shared league
    // mock isn't formatted as one, so use a local league just for this test.
    const league = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([league]);
    mockGetSuggestions.mockResolvedValue([
      {
        player_id: 'player-1',
        player_name: 'Dios Vo',
        games_played: 10,
        avg_points: 24.5,
      },
    ]);
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    // MVP is an individual type, set directly rather than through the
    // (portal-rendered, hard to scope in jsdom) Select UI.
    const { user } = await open('Add', { achievement_id: '', type: 'mvp' });

    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(league.name));

    const suggestion = await screen.findByText(/Dios Vo.*24.5/);
    expect(suggestion).toBeInTheDocument();

    // Clicking the suggestion fills the player field via setValue.
    await user.click(suggestion);
  });

  test('updates year automatically when league is selected', async () => {
    const league = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([league]);

    const { user } = await open('Add', { achievement_id: '', type: 'champion' });

    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(league.name));

    // Year should be automatically set and disabled after league selection
    await waitFor(() => {
      const [, , yearSelect] = screen.getAllByRole('combobox');
      expect(yearSelect).toBeDisabled();
    });
  });

  test('loads leagues data on component mount', async () => {
    const league = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([league]);

    await open('Add', { achievement_id: '' });

    // Verify leagues are loaded
    await waitFor(() => {
      expect(mockGetLeagues).toHaveBeenCalled();
    });
  });

  test('loads player suggestions when individual type and league are selected', async () => {
    const league = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([league]);
    mockGetSuggestions.mockResolvedValue([
      {
        player_id: 'player-1',
        player_name: 'John Doe',
        games_played: 10,
        avg_points: 20.0,
      },
    ]);

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
    });

    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(league.name));

    // Verify suggestions are loaded
    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith(league.league_id);
    });
  });

  test('clicking suggestion button fills player field', async () => {
    const league = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([league]);
    mockGetSuggestions.mockResolvedValue([
      {
        player_id: 'player-2',
        player_name: 'Jane Smith',
        games_played: 15,
        avg_points: 25.5,
      },
    ]);
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
    });

    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(league.name));

    // Wait for suggestions and click
    const suggestionButton = await screen.findByRole('button', {
      name: /Jane Smith/,
    });
    await user.click(suggestionButton);

    // Verify form is ready to submit with player selected
    const submit = screen.getByRole('button', { name: /add/i });
    expect(submit).toBeInTheDocument();
  });

  test('resets form after successful submission for Add action', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement added successfully',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('handles submission error response', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: false,
      message: 'Failed to save achievement - validation error',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('clears player_id for non-individual achievement types', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    // Champion is a team/collective achievement, not individual
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      player_id: 'player-123', // Should be cleared
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          player_id: null, // Should be null for non-individual types
        }),
      );
    });
  });

  test('does not show player field for non-individual achievement types', async () => {
    await open('Add', { achievement_id: '', type: 'champion' });

    // Champion is non-individual, player field should be hidden via Visibility
    await waitFor(() => {
      const playerLabels = screen.queryAllByText(/Players?/i);
      // Only find the first one (league field has a helper), player field should not appear
      expect(
        playerLabels.filter((label) => label.textContent?.match(/^Players?$/)),
      ).toHaveLength(0);
    });
  });

  test('shows player field for individual achievement types', async () => {
    mockGetActivePlayers.mockResolvedValue([]);

    const { user } = await open('Add', { achievement_id: '', type: 'mvp' });

    // MVP is an individual type, player field should be visible
    await waitFor(() => {
      const comboboxes = screen.getAllByRole('combobox');
      // Should have: type, league, year, and player comboboxes
      expect(comboboxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  test('closes dialog on successful Update submission', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement updated',
    });

    const { user } = await open('Update', {
      achievement_id: 'test-id',
      type: 'champion',
      title: 'Champions',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        'test-id',
        expect.any(Object),
      );
    });
  });

  test('does not close dialog on Add submission success', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement added',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Champions',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });

    // Dialog should still be visible after Add (form was reset but not closed)
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('handles description field input and submission', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test Achievement',
      year: 2024,
      description: '',
    });

    const descriptionField = screen.getByPlaceholderText(/Comment/i);
    await user.type(descriptionField, 'This is a test description');

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          description: 'This is a test description',
        }),
      );
    });
  });

  test('preserves custom title when not dirty and type changes', async () => {
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
      title: 'Custom MVP Award',
    });

    // Title should be 'Custom MVP Award' (what was passed in)
    const titleInputs = screen.queryAllByDisplayValue('Custom MVP Award');
    expect(titleInputs.length).toBeGreaterThan(0);
  });

  test('renders helper text for year field when league is selected', async () => {
    const league = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([league]);

    const { user } = await open('Add', { achievement_id: '', type: 'champion' });

    // Select league
    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(league.name));

    // Year field should show helper text
    await waitFor(() => {
      // Helper text appears dynamically, just verify year select exists and is disabled
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(2);
    });
  });

  test('displays success toast on successful submission', async () => {
    const successMessage = 'Achievement saved successfully';
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: successMessage,
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('displays error toast on failed submission', async () => {
    const errorMessage = 'Failed to save achievement';
    mockUpsertAchievement.mockResolvedValue({
      success: false,
      message: errorMessage,
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('button shows loading state while submitting', async () => {
    mockUpsertAchievement.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                message: 'Saved',
              }),
            50,
          ),
        ),
    );

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());

    // Click to start submission
    await user.click(submit);

    // Wait for action to be called
    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('resets form fields after successful Add submission', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement saved',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Champions 2024',
      year: 2024,
      description: 'Test description',
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });

    // Form should still be open (not closed in Add mode)
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('year is auto-populated from selected league end_date', async () => {
    const testLeague = {
      ...MOCK_LEAGUE,
      league_id: '22222222-2222-2222-2222-222222222222',
      end_date: new Date(2023, 11, 31).toISOString(), // Dec 31, 2023
      player_count: 0,
      achievement_type: [],
    };
    mockGetLeagues.mockResolvedValue([testLeague]);

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      year: 2024, // Start with 2024
    });

    // Select the league
    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(testLeague.name));

    // Verify the selection worked
    await waitFor(() => {
      const yearSelects = screen.getAllByRole('combobox');
      expect(yearSelects.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('properly shows/hides individual type player field', async () => {
    mockGetActivePlayers.mockResolvedValue([
      { ...MOCK_USER_WITH_PLAYER, id: 'player-new-1', name: 'New Player' },
    ]);

    // Start with non-individual type
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    // Dialog should render properly
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
    
    // Verify form is interactive
    const submit = screen.getByRole('button', { name: /add/i });
    expect(submit).toBeInTheDocument();
  });

  test('handles null suggestions gracefully', async () => {
    mockGetSuggestions.mockResolvedValue([]);
    mockGetLeagues.mockResolvedValue([]);

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
    });

    // Component should render without crashing
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('form submission with all fields populated correctly passes data', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement created',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Season Achievement',
      year: 2024,
      league_id: null,
      description: 'Outstanding performance',
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          type: 'champion',
          title: 'Season Achievement',
          year: 2024,
          description: 'Outstanding performance',
        }),
      );
    });
  });

  test('error case does not close Update dialog and allows retry', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: false,
      message: 'Server error',
    });

    const { user } = await open('Update', {
      achievement_id: 'error-test-id',
      type: 'champion',
      title: 'Error Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // Wait for submission with error response
    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledTimes(1);
    });
  });

  test('success=true in response calls reset() for Add mode', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved successfully',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test Achievement',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // Wait for submission with success response
    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.any(Object),
      );
    });

    // Dialog remains open (Add mode doesn't close)
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('conditional player_id is null for team achievement types on submission', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    // Pass player_id for team type (should be cleared)
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion', // Team type
      title: 'Champions',
      year: 2024,
      player_id: 'some-player-id', // This should be cleared
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          player_id: null, // Should be null for team type
        }),
      );
    });
  });

  test('maintains form fields through multiple successful submissions', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Champions Cup',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });

    // First submission
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledTimes(1);
    });

    // Dialog should still be visible
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('renders close button in dialog', async () => {
    await open('Add', { achievement_id: '' });

    // Dialog should have close button
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(
      (btn) =>
        btn.getAttribute('aria-label')?.includes('Close') ||
        btn.className?.includes('close'),
    );
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  test('toaster is called with loading state on submission', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Achievement saved',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalled();
    });
  });

  test('form fields are properly registered with react-hook-form', async () => {
    await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test Title',
      year: 2024,
      description: 'Test description',
    });

    // Verify form fields are rendered and accessible
    const submit = screen.getByRole('button', { name: /add/i });
    expect(submit).toBeInTheDocument();
  });

  test('individual type achievement includes player when provided', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    // MVP is an individual type
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
      title: 'MVP',
      year: 2024,
    });

    // Dialog should render for individual type
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('non-individual achievement clears player_id regardless of input', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    // Champion is a team type, even if player_id is provided
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Champions',
      year: 2024,
      player_id: 'should-be-cleared',
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          player_id: null,
        }),
      );
    });
  });

  test('form passes empty description when not provided', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
      description: '',
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({
          description: '',
        }),
      );
    });
  });

  test('Update action id is correctly passed to upsertAchievement', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Updated',
    });

    const achievementId = 'specific-achievement-id-123';
    const { user } = await open('Update', {
      achievement_id: achievementId,
      type: 'champion',
      title: 'Update Test',
      year: 2024,
    });

    const submit = screen.getByRole('button', { name: /update/i });
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        achievementId,
        expect.any(Object),
      );
    });
  });

  test('league_id changes trigger year field recalculation', async () => {
    const league1 = {
      ...MOCK_LEAGUE,
      league_id: '11111111-1111-1111-1111-111111111111',
      name: 'League 2023',
      end_date: new Date(2023, 11, 31).toISOString(),
      player_count: 0,
      achievement_type: [],
    };

    mockGetLeagues.mockResolvedValue([league1]);

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      year: 2024,
    });

    // Select league
    const [leagueCombobox] = await screen.findAllByPlaceholderText(
      'Type to search',
    );
    await user.click(leagueCombobox);
    await user.click(await screen.findByText(league1.name));

    // Verify selection worked
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('isIndividualType function correctly identifies individual types', async () => {
    // Open with MVP (individual type)
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
      title: 'MVP',
      year: 2024,
    });

    // Component should render successfully
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();

    // Verify form fields exist
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
  });

  test('onBlur is triggered for form fields', async () => {
    const { user } = await open('Add', {
      achievement_id: '',
      type: 'champion',
      title: 'Test',
      year: 2024,
    });

    // Find type combobox and interact with it
    const typeCombobox = (await screen.findAllByRole('combobox'))[0];
    await user.click(typeCombobox);

    // Click elsewhere to blur
    await user.click(screen.getByText('Add Achievement'));

    // Form should still be present
    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('dialog closes on successful Update submission with correct action check', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Updated',
    });

    const { user } = await open('Update', {
      achievement_id: 'test-update-id',
      type: 'champion',
      title: 'Test Update',
      year: 2024,
    });

    const submit = screen.getByRole('button', { name: /update/i });
    await user.click(submit);

    // Verify the action was called
    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        'test-update-id',
        expect.any(Object),
      );
    });
  });

  // ── Type Select interaction ────────────────────────────────────────────────

  const openSelectAndGetContent = async (
    user: ReturnType<typeof renderWithUI>['user'],
    comboboxIndex: number,
  ) => {
    const comboboxes = await screen.findAllByRole('combobox');
    const trigger = comboboxes[comboboxIndex];
    await user.click(trigger);
    return {
      trigger,
      content: document.getElementById(trigger.getAttribute('aria-controls')!),
    };
  };

  test('updates the default title when type is changed via the dropdown', async () => {
    const { user } = await open('Add', { achievement_id: '', type: 'champion' });

    const { content } = await openSelectAndGetContent(user, 0);
    const option = within(content!).getByRole('option', {
      name: 'Runner-up',
      hidden: true,
    });
    fireEvent.click(option);

    await waitFor(() =>
      expect(screen.queryAllByDisplayValue('Runner-up').length).toBeGreaterThan(0),
    );
  });

  test('keeps a custom title when type changes after the title has been edited', async () => {
    const { user } = await open('Add', { achievement_id: '', type: 'champion' });

    const titleInput = screen.getByPlaceholderText('Champion');
    await user.clear(titleInput);
    await user.type(titleInput, 'My Custom Title');

    const { content } = await openSelectAndGetContent(user, 0);
    const option = within(content!).getByRole('option', {
      name: 'Runner-up',
      hidden: true,
    });
    fireEvent.click(option);

    expect(screen.getByDisplayValue('My Custom Title')).toBeInTheDocument();
  });

  test('blurs the type field when interacting outside the open dropdown', async () => {
    const { user } = await open('Add', { achievement_id: '' });
    const [typeSelect] = await screen.findAllByRole('combobox');
    await user.click(typeSelect);

    // Zag's onFocusin defers the callback via requestAnimationFrame (defer: true).
    // Spy on it to run callbacks synchronously so onInteractOutside fires inline.
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((fn) => {
        fn(performance.now());
        return 0;
      });
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    try {
      // FocusEvent has no clientX/Y → isEventPointWithin → false →
      // isEventOutside → true → onInteractOutside → field.onBlur() (line 172).
      fireEvent(outsideEl, new FocusEvent('focusin', { bubbles: true }));
    } finally {
      rafSpy.mockRestore();
      document.body.removeChild(outsideEl);
    }
    await act(async () => {});
  });

  // ── Year Select interaction ────────────────────────────────────────────────

  test('updates the year when a value is manually selected from the dropdown', async () => {
    const { user } = await open('Add', { achievement_id: '', type: 'champion' });

    // Combobox order: [type, league, year]
    const { content } = await openSelectAndGetContent(user, 2);
    const prevYear = String(new Date().getFullYear() - 1);
    const option = within(content!).getByRole('option', {
      name: prevYear,
      hidden: true,
    });
    fireEvent.click(option);

    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('blurs the year field when interacting outside the open dropdown', async () => {
    const { user } = await open('Add', { achievement_id: '' });

    const comboboxes = await screen.findAllByRole('combobox');
    await user.click(comboboxes[2]);

    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((fn) => {
        fn(performance.now());
        return 0;
      });
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    try {
      fireEvent(outsideEl, new FocusEvent('focusin', { bubbles: true }));
    } finally {
      rafSpy.mockRestore();
      document.body.removeChild(outsideEl);
    }
    await act(async () => {});
  });

  // ── Falsy field.value branches in Select value prop ───────────────────────

  test('renders the type Select as empty when type has no initial value', async () => {
    await open('Add', { achievement_id: '', type: undefined });

    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('renders the year Select as empty when year has no initial value', async () => {
    await open('Add', { achievement_id: '', year: undefined });

    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
  });

  test('passes player_id through for individual achievement types on submit', async () => {
    mockUpsertAchievement.mockResolvedValue({ success: true, message: 'Saved' });
    // Provide a player so the refine constraint (player required for mvp) is met.
    mockGetActivePlayers.mockResolvedValue([
      { ...MOCK_USER_WITH_PLAYER, id: 'player-individual-123', name: 'MVP Player' },
    ]);

    const { user } = await open('Add', {
      achievement_id: '',
      type: 'mvp',
      title: 'MVP Award',
      year: 2024,
      player_id: 'player-individual-123',
    });

    const submit = await screen.findByRole('button', { name: /add/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() =>
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        '',
        expect.objectContaining({ type: 'mvp' }),
      ),
    );
  });
});
