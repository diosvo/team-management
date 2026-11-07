import { removeTestNote } from '@/actions/progression';
import usePermissions from '@/hooks/use-permissions';
import {
  MOCK_GENERAL_NOTE,
  MOCK_PROGRESSION_TYPE,
  MOCK_TEST_NOTE,
} from '@/test/mocks/progression';
import {
  createPermissionsMock,
  createToasterMock,
  mockToaster,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { AddTestNote } from './AddTestNote';
import TestNotes from './TestNotes';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));
vi.mock('@/actions/progression', () => ({
  removeTestNote: vi.fn(),
}));
vi.mock('@/components/ui/toaster', () => createToasterMock());
// Stub the overlay controller; its dialog has its own test.
vi.mock('./AddTestNote', () => ({
  AddTestNote: { open: vi.fn() },
}));

describe('TestNotes', () => {
  const setup = (
    notes = [MOCK_TEST_NOTE, MOCK_GENERAL_NOTE],
    canManage = false,
    locale?: 'vi',
  ) => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ can: vi.fn(() => canManage) }),
    );
    return renderWithUI(
      <TestNotes
        playerId="player-1"
        notes={notes}
        types={[MOCK_PROGRESSION_TYPE]}
      />,
      { locale },
    );
  };

  setupTestLifecycle();

  test('shows the empty state without notes', () => {
    setup([]);

    expect(screen.getByText('No notes yet')).toBeInTheDocument();
  });

  test('renders typed and general notes', () => {
    setup();

    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Goal: 45 reps')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText(/Coach Carter/)).toBeInTheDocument();
    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove note' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit note' }),
    ).not.toBeInTheDocument();
  });

  test.each([
    ['met', 'Goal met'],
    ['missed', 'Goal missed'],
    ['pending', 'Awaiting next test'],
  ] as const)('badges a %s goal', (outcome, label) => {
    setup([{ ...MOCK_TEST_NOTE, outcome }]);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  test('opens the note dialog to edit a note', async () => {
    const { user } = setup([MOCK_TEST_NOTE], true);

    await user.click(screen.getByRole('button', { name: 'Edit note' }));

    expect(AddTestNote.open).toHaveBeenCalledWith('add-test-note', {
      playerId: 'player-1',
      types: [MOCK_PROGRESSION_TYPE],
      note: MOCK_TEST_NOTE,
    });
  });

  test('renders the relative time in Vietnamese', () => {
    setup([MOCK_TEST_NOTE], false, 'vi');

    expect(screen.getByText(/trước/)).toBeInTheDocument();
  });

  test.each([true, false])(
    'removes a note and reports the outcome (success: %s)',
    async (success) => {
      vi.mocked(removeTestNote).mockResolvedValue({
        success,
        message: 'Done',
      } as never);
      const { user } = setup([MOCK_TEST_NOTE], true);

      await user.click(screen.getByRole('button', { name: 'Remove note' }));

      await waitFor(() =>
        expect(mockToaster.update).toHaveBeenCalledWith(expect.anything(), {
          type: success ? 'success' : 'error',
          title: 'Done',
        }),
      );
      expect(removeTestNote).toHaveBeenCalledWith('note-1');
    },
  );
});
