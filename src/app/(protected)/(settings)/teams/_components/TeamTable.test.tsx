import { MOCK_AWAY_TEAM, MOCK_TEAM } from '@/test/mocks/team';
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
  waitForStable,
} from '@/test/utilities';

import usePermissions, {
  type PermissionsResult,
} from '@/hooks/use-permissions';

import { removeTeam } from '@/actions/team';
import type { Team } from '@/drizzle/schema';

import { useTeamLogo } from '@/hooks/use-image';
import TeamTable from './TeamTable';
import { UpsertTeam } from './UpsertTeam';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/use-image', () => ({
  useTeamLogo: vi.fn(),
}));

vi.mock('@/actions/team', () => ({
  removeTeam: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertTeam', () => ({
  UpsertTeam: { open: vi.fn(), Viewport: () => null },
}));

describe('TeamTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockUseTeamLogo = vi.mocked(useTeamLogo);
  const mockRemoveTeam = vi.mocked(removeTeam);
  const mockOpen = vi.mocked(UpsertTeam.open);

  const setup = async ({
    teams = [MOCK_TEAM, MOCK_AWAY_TEAM],
    can = () => false,
    params = {},
  }: Partial<{
    teams: Array<Team>;
    can: PermissionsResult['can'];
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can }));
    mockUseTeamLogo.mockReturnValue({
      data: null,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });
    mockUseQueryStates({ page: 1, q: '', ...params });

    const result = renderWithUI(<TeamTable teams={teams} />);

    // The avatar in each row settles its load state asynchronously; flush it
    // here so those updates land inside act(...).
    await waitForStable();

    return result;
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = await setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each team', async () => {
    await setup();

    expect(screen.getByText(MOCK_TEAM.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_AWAY_TEAM.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEAM.email!)).toBeInTheDocument();
  });

  test('renders the column headers', async () => {
    await setup();

    ['Name', 'Email', 'Established', 'Last Updated'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('shows the empty state when there are no teams', async () => {
    await setup({ teams: [] });

    expect(screen.getByText('No teams found')).toBeInTheDocument();
  });

  test('filters the teams by the search query', async () => {
    await setup({ params: { q: 'saigon' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Saigon', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(MOCK_AWAY_TEAM.name)).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode when a row is clicked', async () => {
    const { user } = await setup({ can: (_, action) => action === 'edit' });

    await user.click(screen.getByText(MOCK_TEAM.name));

    expect(mockOpen).toHaveBeenCalledWith('update-team', {
      action: 'Update',
      item: MOCK_TEAM,
    });
  });

  test('does not open the dialog when the user cannot edit', async () => {
    const { user } = await setup({ can: () => false });

    await user.click(screen.getByText(MOCK_TEAM.name));

    expect(mockOpen).not.toHaveBeenCalled();
  });

  describe('selection', () => {
    const canDelete = (_: string, action: string) => action === 'delete';

    test('deletes the selected teams and reports success', async () => {
      mockRemoveTeam.mockResolvedValue({ success: true, message: 'Removed' });

      const { user } = await setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveTeam.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([MOCK_TEAM.team_id, MOCK_AWAY_TEAM.team_id]),
        );
      });

      expect(mockToaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveTeam
        .mockResolvedValueOnce({ success: true, message: 'Removed' })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = await setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(mockToaster.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
