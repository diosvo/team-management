import {
  MOCK_PLAYER_TYPE_PROGRESSION,
  MOCK_PROGRESSION_TYPE,
  MOCK_GENERAL_NOTE,
  MOCK_TEST_NOTE,
} from '@/test/mocks/progression';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { PerformanceBand, ProgressStatus } from '@/utils/enum';

import { getPlayerProgressionById } from '@/actions/progression';

import PlayerProgressionPage, { generateMetadata } from './page';

vi.mock('@/actions/progression', () => ({
  getPlayerProgressionById: vi.fn(),
}));

// Child components are covered by their own tests.
vi.mock('./_components/PlayerProgressionHeader', () => ({
  default: ({
    playerName,
    usedTypeIds,
  }: {
    playerName: string;
    usedTypeIds: Array<string>;
  }) => <h1 data-used={usedTypeIds.join(',')}>{playerName}</h1>,
}));
vi.mock('./_components/TypeProgressionCard', () => ({
  default: () => <div data-testid="type-card" />,
}));
vi.mock('./_components/TestHistory', () => ({
  default: () => <div data-testid="history" />,
}));
vi.mock('./_components/TestNotes', () => ({
  default: () => <div data-testid="notes" />,
}));

const statText = (label: string) =>
  screen.getByText(label).parentElement?.parentElement?.textContent;

describe('PlayerProgressionPage', () => {
  const mockGet = vi.mocked(getPlayerProgressionById);

  const setup = async () => {
    const ui = await PlayerProgressionPage({
      params: Promise.resolve({ id: 'player-1' }),
      searchParams: Promise.resolve({}),
    } as Parameters<typeof PlayerProgressionPage>[0]);
    return renderWithUI(ui);
  };

  setupTestLifecycle();

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Player Progression');
  });

  test('summarises every tracked test type', async () => {
    mockGet.mockResolvedValue({
      player_id: 'player-1',
      player_name: 'Alice',
      types: [
        MOCK_PLAYER_TYPE_PROGRESSION,
        {
          ...MOCK_PLAYER_TYPE_PROGRESSION,
          status: ProgressStatus.REGRESSING,
          band: PerformanceBand.ON_TARGET,
        },
        {
          ...MOCK_PLAYER_TYPE_PROGRESSION,
          status: ProgressStatus.STABLE,
          band: PerformanceBand.NEEDS_WORK,
        },
      ],
      notes: [MOCK_TEST_NOTE, MOCK_GENERAL_NOTE],
      test_types: [MOCK_PROGRESSION_TYPE],
    });

    await setup();

    expect(mockGet).toHaveBeenCalledWith('player-1');
    // Only typed notes use up a focus area.
    expect(screen.getByRole('heading', { name: 'Alice' })).toHaveAttribute(
      'data-used',
      MOCK_TEST_NOTE.type_id,
    );
    expect(statText('Tests Tracked')).toContain('3');
    expect(statText('Improving')).toContain('1');
    expect(statText('Regressing')).toContain('1');
    expect(statText('On Target')).toContain('2');
    expect(screen.getAllByTestId('type-card')).toHaveLength(3);
    expect(screen.getByTestId('history')).toBeInTheDocument();
    expect(screen.getByTestId('notes')).toBeInTheDocument();
  });

  test('shows the empty state before the player is tested', async () => {
    mockGet.mockResolvedValue({
      player_id: 'player-1',
      player_name: 'Alice',
      types: [],
      notes: [],
      test_types: [],
    });

    await setup();

    expect(screen.getByText('No test results yet')).toBeInTheDocument();
    expect(screen.queryByTestId('history')).not.toBeInTheDocument();
    expect(screen.getByTestId('notes')).toBeInTheDocument();
  });
});
