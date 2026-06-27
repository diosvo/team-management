import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import { getOverviewStats } from '@/actions/analytics';
import OverviewStats from './OverviewStats';

vi.mock('@/actions/analytics', () => ({
  getOverviewStats: vi.fn(),
}));

describe('OverviewStats', () => {
  const mockGetOverviewStats = getOverviewStats as unknown as Mock;

  const DEFAULT_STATS = { active_players: 12, next_game: 3, win_rate: 75 };

  const setup = async (
    stats?: Partial<Awaited<ReturnType<typeof getOverviewStats>>>,
  ) => {
    mockGetOverviewStats.mockResolvedValue({ ...DEFAULT_STATS, ...stats });
    return renderWithUI(await OverviewStats());
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the card title and description', async () => {
    await setup();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(
      screen.getByText('Key performance indicators at a glance'),
    ).toBeInTheDocument();
  });

  test('renders the key statistics', async () => {
    await setup();

    expect(screen.getByText('Active Players')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('Next Game')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('days remaining')).toBeInTheDocument();

    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  test('hides the next game stat when there is no upcoming game', async () => {
    await setup({ next_game: null });

    expect(screen.getByText('Next Game').closest('[hidden]')).not.toBeNull();
  });

  test('shows the next game stat when an upcoming game exists', async () => {
    await setup({ next_game: 5 });

    expect(screen.getByText('Next Game').closest('[hidden]')).toBeNull();
  });
});
