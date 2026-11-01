import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { getLeagues } from '@/actions/league';

import LeaguesPage, { generateMetadata } from './page';

vi.mock('@/actions/league', () => ({ getLeagues: vi.fn() }));

vi.mock('./_components/LeagueHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/LeagueFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/LeagueTable', () => ({
  default: ({ leagues }: { leagues: Array<unknown> }) => (
    <div data-testid="table">{leagues.length}</div>
  ),
}));

describe('LeaguesPage', () => {
  const mockGetLeagues = vi.mocked(getLeagues);

  setupTestLifecycle();

  beforeEach(() => {
    mockGetLeagues.mockResolvedValue([{ league_id: '1' }] as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Leagues');
  });

  test('should be accessible', async () => {
    const { container } = renderWithUI(await LeaguesPage());

    await expectNoA11yViolations(container);
  });

  test('renders every section with the fetched leagues', async () => {
    renderWithUI(await LeaguesPage());

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });
});
