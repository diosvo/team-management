import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import { getPerformanceSummary } from '@/actions/player-performance';
import type { PerformanceSummary } from '@/types/performance';
import { formatDate } from '@/utils/datetime';

import PerformanceStats from './PerformanceStats';

vi.mock('@/actions/player-performance', () => ({
  getPerformanceSummary: vi.fn(),
}));

const TARGET_ID = 'player-1';
const RANGE = { from: '2026-01-01', to: '2026-12-31' };

const SUMMARY: PerformanceSummary = {
  attendance: {
    rate: 75,
    total: 8,
    on_time: 5,
    late: 1,
    current_streak: 3,
    best_streak: 5,
  },
  tests_taken: 2,
  last_tested: '2026-03-15',
  honors: [
    {
      achievement_id: 'a-1',
      type: 'mvp',
      title: 'MVP',
      year: 2026,
      league: null,
    },
  ],
};

describe('PerformanceStats', () => {
  const mockGetSummary = vi.mocked(getPerformanceSummary);

  setupTestLifecycle();

  const setup = async (summary: PerformanceSummary = SUMMARY) => {
    mockGetSummary.mockResolvedValue(summary);

    return renderWithUI(
      await PerformanceStats({ target_id: TARGET_ID, range: RANGE }),
    );
  };

  test('fetches the summary for the player and period', async () => {
    await setup();

    expect(mockGetSummary).toHaveBeenCalledWith(TARGET_ID, RANGE);
  });

  test('renders every stat with its details', async () => {
    await setup();

    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();
    expect(screen.getByText('6/8 sessions')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Best run: 5')).toBeInTheDocument();
    expect(screen.getByText('Tests Taken')).toBeInTheDocument();
    expect(
      screen.getByText(`Last tested ${formatDate('2026-03-15')}`),
    ).toBeInTheDocument();
    expect(screen.getByText('Individual Honors')).toBeInTheDocument();
    expect(screen.getByText('MVP · 2026')).toBeInTheDocument();
  });

  test('falls back to hints when there is nothing recorded', async () => {
    await setup({
      attendance: {
        rate: 0,
        total: 0,
        on_time: 0,
        late: 0,
        current_streak: 0,
        best_streak: 0,
      },
      tests_taken: 0,
      last_tested: null,
      honors: [],
    });

    expect(screen.getByText('No sessions recorded')).toBeInTheDocument();
    expect(screen.getByText('Best run: 0')).toBeInTheDocument();
    expect(screen.getByText('All time')).toBeInTheDocument();
    expect(screen.getByText('MVP, top scorer, ...')).toBeInTheDocument();
  });
});
