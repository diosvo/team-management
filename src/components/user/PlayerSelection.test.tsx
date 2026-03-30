import { axe } from 'jest-axe';
import { SWRConfig } from 'swr';

import { MOCK_PLAYER, MOCK_USER_WITH_PLAYER } from '@/test/mocks/user';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { getActivePlayers } from '@/actions/user';
import { User } from '@/drizzle/schema/user';
import { PlayerSelection, SelectedPlayers } from './PlayerSelection';

vi.mock('@/actions/user', () => ({
  getActivePlayers: vi.fn(),
}));

const withFreshSWR = (ui: React.ReactElement) => (
  <SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>
);

describe('PlayerSelection', () => {
  const onSelectionChange = vi.fn();
  const mockGetActivePlayers = vi.mocked(getActivePlayers);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActivePlayers.mockResolvedValue([MOCK_USER_WITH_PLAYER]);
  });

  const setup = async (selection: User[] = []) => {
    const component = renderWithUI(
      withFreshSWR(
        <PlayerSelection
          selection={selection}
          onSelectionChange={onSelectionChange}
        />,
      ),
    );
    const placeholder = screen.getByPlaceholderText('Type to search');

    await waitFor(() => expect(mockGetActivePlayers).toHaveBeenCalled());

    return { placeholder, ...component };
  };

  test('should be accessible', async () => {
    const { container } = await setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders with label', async () => {
    await setup();

    expect(screen.getByText(/Select players/i)).toBeInTheDocument();
  });

  test('renders player names when dropdown is opened', async () => {
    const { user, placeholder } = await setup();

    await user.click(placeholder);

    expect(
      await screen.findByText(MOCK_USER_WITH_PLAYER.name),
    ).toBeInTheDocument();
  });

  test('renders jersey number prefix when player has one', async () => {
    const { user, placeholder } = await setup();

    await user.click(placeholder);

    await screen.findByText(MOCK_USER_WITH_PLAYER.name);
    expect(
      screen.getByText(new RegExp(`${MOCK_PLAYER.jersey_number} -`)),
    ).toBeInTheDocument();
  });

  test('displays empty state when no players found', async () => {
    mockGetActivePlayers.mockResolvedValue([]);
    const { user, placeholder } = await setup();

    await user.click(placeholder);

    expect(screen.getByText('No players found.')).toBeInTheDocument();
  });

  test('calls onSelectionChange with selected player array', async () => {
    const { user, placeholder } = await setup();

    await user.click(placeholder);
    await user.click(await screen.findByText(MOCK_USER_WITH_PLAYER.name));

    expect(onSelectionChange).toHaveBeenCalledWith([MOCK_USER_WITH_PLAYER]);
  });
});

describe('SelectedPlayers', () => {
  const onSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (selection: Array<User> = [MOCK_USER_WITH_PLAYER]) =>
    renderWithUI(
      <SelectedPlayers
        selection={selection}
        onSelectionChange={onSelectionChange}
      />,
    );

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('shows empty state when no players are selected', () => {
    setup([]);

    expect(screen.getByText('No players selected')).toBeInTheDocument();
  });

  test('renders selected player names', () => {
    setup();

    expect(screen.getByText(MOCK_USER_WITH_PLAYER.name)).toBeInTheDocument();
  });

  test('renders jersey number prefix for players with one', () => {
    setup();

    expect(
      screen.getByText(new RegExp(`${MOCK_PLAYER.jersey_number} -`)),
    ).toBeInTheDocument();
  });

  test('calls onSelectionChange without removed player on click', async () => {
    const { user } = setup();

    const playerItem = screen
      .getByText(MOCK_USER_WITH_PLAYER.name)
      .closest('li')!;
    await user.click(playerItem);

    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });
});
