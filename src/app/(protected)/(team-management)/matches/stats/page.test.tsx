import {
  canEditMatchStats,
  getMatchPlayerStats,
  getPlayedMatches,
} from '@/actions/match';
import { getActivePlayers } from '@/actions/user';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import MatchStatsPage, { generateMetadata } from './page';

vi.mock('@/actions/match', () => ({
  canEditMatchStats: vi.fn(),
  getMatchPlayerStats: vi.fn(),
  getPlayedMatches: vi.fn(),
}));
vi.mock('@/actions/user', () => ({ getActivePlayers: vi.fn() }));

vi.mock('./_components/MatchStatsPageClient', () => ({
  default: ({
    initialMatch,
    initialStats,
  }: {
    initialMatch: { match_id: string } | null;
    initialStats: Array<unknown>;
  }) => (
    <div data-testid="client">
      {initialMatch?.match_id ?? 'none'}:{initialStats.length}
    </div>
  ),
}));

describe('MatchStatsPage', () => {
  const mockCanEdit = vi.mocked(canEditMatchStats);
  const mockGetStats = vi.mocked(getMatchPlayerStats);
  const mockGetPlayed = vi.mocked(getPlayedMatches);
  const mockGetActive = vi.mocked(getActivePlayers);

  setupTestLifecycle();

  const setup = async (searchParams: Record<string, unknown> = {}) => {
    const props = {
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    } as Parameters<typeof MatchStatsPage>[0];

    return renderWithUI(await MatchStatsPage(props));
  };

  beforeEach(() => {
    mockCanEdit.mockResolvedValue(true);
    mockGetPlayed.mockResolvedValue([{ match_id: 'm1' }] as never);
    mockGetActive.mockResolvedValue([] as never);
    mockGetStats.mockResolvedValue([{ player_id: 'p1' }] as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Box Score');
  });

  test('forbids access when stats are not editable', async () => {
    mockCanEdit.mockResolvedValue(false);

    // `forbidden()` is mocked in the test setup to throw.
    await expect(setup()).rejects.toThrow('FORBIDDEN');
  });

  test('preselects the match from the search params with its stats', async () => {
    await setup({ match: 'm1' });

    expect(screen.getByText('Box Score')).toBeInTheDocument();
    expect(screen.getByTestId('client')).toHaveTextContent('m1:1');
    expect(mockGetStats).toHaveBeenCalledWith('m1');
  });

  test('starts empty when the match is unknown', async () => {
    await setup({ match: 'missing' });

    expect(screen.getByTestId('client')).toHaveTextContent('none:0');
    expect(mockGetStats).not.toHaveBeenCalled();
  });

  test('ignores a non-string match param', async () => {
    await setup({ match: ['m1', 'm2'] });

    expect(screen.getByTestId('client')).toHaveTextContent('none:0');
  });
});
