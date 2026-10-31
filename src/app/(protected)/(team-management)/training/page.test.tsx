import {
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import { getSessions } from '@/actions/training-session';
import { loadTrainingFilters } from '@/lib/nuqs';

import TrainingSessionsPage, { generateMetadata } from './page';

vi.mock('@/actions/training-session', () => ({ getSessions: vi.fn() }));
vi.mock('@/lib/nuqs', () => ({ loadTrainingFilters: vi.fn() }));

vi.mock('./_components/SessionHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/SessionStats', () => ({
  default: ({ stats }: { stats: { totalHours: number } }) => (
    <div data-testid="stats">{stats.totalHours}</div>
  ),
}));
vi.mock('./_components/SessionFilters', () => ({
  default: () => <div data-testid="filters" />,
}));
vi.mock('./_components/SessionTable', () => ({
  default: ({ sessions }: { sessions: Array<unknown> }) => (
    <div data-testid="table">{sessions.length}</div>
  ),
}));

describe('TrainingSessionsPage', () => {
  const mockLoadFilters = vi.mocked(loadTrainingFilters);
  const mockGetSessions = vi.mocked(getSessions);

  setupTestLifecycle();

  const setup = async (searchParams: Record<string, unknown> = {}) => {
    const props = {
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    } as Parameters<typeof TrainingSessionsPage>[0];

    return renderWithUI(await TrainingSessionsPage(props));
  };

  beforeEach(() => {
    mockLoadFilters.mockResolvedValue({} as never);
    mockGetSessions.mockResolvedValue({
      stats: { totalHours: 5 },
      data: [{ session_id: '1' }],
    } as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Training Sessions');
  });

  test('should be accessible', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  test('renders every section with the fetched data', async () => {
    await setup();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toHaveTextContent('5');
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });
});
