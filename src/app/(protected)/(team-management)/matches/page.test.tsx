import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { getMatches } from '@/actions/match';
import { loadMatchFilters } from '@/lib/nuqs';

import MatchesPage, { generateMetadata } from './page';

vi.mock('@/actions/match', () => ({ getMatches: vi.fn() }));
vi.mock('@/lib/nuqs', () => ({ loadMatchFilters: vi.fn() }));

vi.mock('./_components/MatchHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/MatchStats', () => ({
  default: ({ stats }: { stats: { totalMatches: number } }) => (
    <div data-testid="stats">{stats.totalMatches}</div>
  ),
}));
vi.mock('./_components/MatchFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/MatchTable', () => ({
  default: ({ matches }: { matches: Array<unknown> }) => (
    <div data-testid="table">{matches.length}</div>
  ),
}));

describe('MatchesPage', () => {
  const mockLoadFilters = vi.mocked(loadMatchFilters);
  const mockGetMatches = vi.mocked(getMatches);

  setupTestLifecycle();

  const setup = async (searchParams: Record<string, unknown> = {}) => {
    const props = {
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    } as Parameters<typeof MatchesPage>[0];

    return renderWithUI(await MatchesPage(props));
  };

  beforeEach(() => {
    mockLoadFilters.mockResolvedValue({} as never);
    mockGetMatches.mockResolvedValue({
      stats: { totalMatches: 7 },
      data: [{ match_id: '1' }],
    } as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Matches');
  });

  test('should be accessible', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  test('renders every section with the fetched data', async () => {
    await setup();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toHaveTextContent('7');
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });
});
