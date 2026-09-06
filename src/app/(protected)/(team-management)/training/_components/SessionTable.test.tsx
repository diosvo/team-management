import { MOCK_TRAINING_SESSION_RESPONSE } from '@/test/mocks/training-sessions';
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
  within,
} from '@/test/utilities';

import usePermissions, {
  type PermissionsResult,
} from '@/hooks/use-permissions';
import type { TrainingSessionWithDetails } from '@/types/training-session';

import { removeSession } from '@/actions/training-session';

import SessionTable from './SessionTable';
import { UpsertSession } from './UpsertSession';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/training-session', () => ({
  removeSession: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

vi.mock('./UpsertSession', () => ({
  UpsertSession: { open: vi.fn(), Viewport: () => null },
}));

describe('SessionTable', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockRemoveSession = vi.mocked(removeSession);
  const mockOpen = vi.mocked(UpsertSession.open);

  const [COMPLETED_SESSION] =
    MOCK_TRAINING_SESSION_RESPONSE.data as Array<TrainingSessionWithDetails>;

  // Both fixtures share a location; give one its own so the search filter has
  // something to discriminate on.
  const OTHER_SESSION: TrainingSessionWithDetails = {
    ...COMPLETED_SESSION,
    session_id: 'session-9',
    date: '2026-12-13',
    location: { name: 'Bien Hoa Stadium' },
  };

  const setup = ({
    sessions = [COMPLETED_SESSION, OTHER_SESSION],
    can = () => false,
    isGuest = false,
    params = {},
  }: Partial<{
    sessions: Array<TrainingSessionWithDetails>;
    can: PermissionsResult['can'];
    isGuest: boolean;
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock({ can, isGuest }));
    mockUseQueryStates({ page: 1, q: '', ...params });

    return renderWithUI(<SessionTable sessions={sessions} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup({});

    await expectNoA11yViolations(container);
  });

  test('renders a row for each session', () => {
    setup();

    expect(screen.getByText(COMPLETED_SESSION.location!.name)).toBeInTheDocument();
    expect(screen.getByText(OTHER_SESSION.location!.name)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Date', 'Time', 'Location', 'Status', 'Present Rate'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders the times, status and present rate of a session', () => {
    setup({ sessions: [COMPLETED_SESSION] });

    expect(
      screen.getByText(COMPLETED_SESSION.start_time),
    ).toBeInTheDocument();
    expect(screen.getByText(COMPLETED_SESSION.end_time)).toBeInTheDocument();
    expect(screen.getByText(COMPLETED_SESSION.status)).toBeInTheDocument();
    expect(
      screen.getByText(`${COMPLETED_SESSION.analytics.present_rate}%`),
    ).toBeInTheDocument();
  });

  test('links the location out to a map', () => {
    setup({ sessions: [COMPLETED_SESSION] });

    expect(
      screen.getByRole('link', { name: COMPLETED_SESSION.location!.name }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining(
        encodeURIComponent(COMPLETED_SESSION.location!.name),
      ),
    );
  });

  test('shows the empty state when there are no sessions', () => {
    setup({ sessions: [] });

    expect(screen.getByText('No training sessions found')).toBeInTheDocument();
  });

  test('filters the sessions by location', () => {
    setup({ params: { q: 'bien hoa' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Bien Hoa', { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText(COMPLETED_SESSION.location!.name),
    ).not.toBeInTheDocument();
  });

  describe('row click', () => {
    const rowOf = (session: TrainingSessionWithDetails) =>
      within(screen.getByText(session.location!.name).closest('tr')!);

    test('opens the dialog in update mode', async () => {
      const { user } = setup();

      await user.click(rowOf(OTHER_SESSION).getByText(OTHER_SESSION.status));

      expect(mockOpen).toHaveBeenCalledWith('update-session', {
        action: 'Update',
        item: OTHER_SESSION,
      });
    });

    test('does nothing for a guest', async () => {
      const { user } = setup({ isGuest: true });

      await user.click(rowOf(OTHER_SESSION).getByText(OTHER_SESSION.status));

      expect(mockOpen).not.toHaveBeenCalled();
    });

    test('keeps the location link from opening the dialog', async () => {
      const { user } = setup();

      await user.click(screen.getByText(OTHER_SESSION.location!.name));

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    const canDelete: PermissionsResult['can'] = (_, action) =>
      action === 'delete';

    test('deletes the selected sessions and reports success', async () => {
      mockRemoveSession.mockResolvedValue({ success: true, message: 'Removed' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveSession.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([
            COMPLETED_SESSION.session_id,
            OTHER_SESSION.session_id,
          ]),
        );
      });

      expect(mockToaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveSession
        .mockResolvedValueOnce({ success: true, message: 'Removed' })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = setup({ can: canDelete });

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
