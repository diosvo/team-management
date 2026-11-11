import usePermissions from '@/hooks/use-permissions';
import { MOCK_PROGRESSION_TYPE } from '@/test/mocks/progression';
import {
  createPermissionsMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { AddTestNote } from './AddTestNote';
import PlayerProgressionHeader from './PlayerProgressionHeader';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

// Stub the overlay controller; its dialog has its own test.
vi.mock('./AddTestNote', () => ({
  AddTestNote: { open: vi.fn(), Viewport: () => null },
}));

describe('PlayerProgressionHeader', () => {
  const setup = (canCreate = false) => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ can: vi.fn(() => canCreate) }),
    );
    return renderWithUI(
      <PlayerProgressionHeader
        playerId="player-1"
        playerName="Alice"
        types={[MOCK_PROGRESSION_TYPE]}
        usedTypeIds={['type-used']}
      />,
    );
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup(true);

    await expectNoA11yViolations(container);
  });

  test('shows the player and hides add note without permission', () => {
    setup();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add note/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the note dialog for users who can create', async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole('button', { name: /add note/i }));

    expect(AddTestNote.open).toHaveBeenCalledWith('add-test-note', {
      usedTypeIds: ['type-used'],
      playerId: 'player-1',
      types: [MOCK_PROGRESSION_TYPE],
    });
  });
});
