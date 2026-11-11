import { PerformanceBand, ProgressStatus } from '@/utils/enum';

import { MOCK_TYPE_PROGRESSION } from '@/test/mocks/progression';
import {
  enumText,
  expectNoA11yViolations,
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import ProgressionTable from './ProgressionTable';

const mockPush = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: mockPush }),
}));

describe('ProgressionTable', () => {
  const setup = (
    params: Record<string, unknown> = {},
    progression: typeof MOCK_TYPE_PROGRESSION | null = MOCK_TYPE_PROGRESSION,
  ) => {
    mockUseQueryStates({ q: '', page: 1, status: [], band: [], ...params });
    return renderWithUI(<ProgressionTable progression={progression} />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders a row per player with results and badges', () => {
    setup();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByText('30 reps')).toHaveLength(2);
    expect(screen.getAllByText('42 reps')).toHaveLength(2);
    expect(
      screen.getByText(enumText('progressStatus', ProgressStatus.IMPROVING)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enumText('performanceBand', PerformanceBand.ELITE)),
    ).toBeInTheDocument();
    // Only Bob missed the latest test.
    expect(screen.getAllByText('Missed latest')).toHaveLength(1);
  });

  test('filters by search query and trend', () => {
    setup({ q: 'ali', status: [ProgressStatus.IMPROVING] });

    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  test('opens the player progression when a row is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByText('Bob'));

    expect(mockPush).toHaveBeenCalledWith(
      '/periodic-testing/progression/player-2',
    );
  });

  test('shows the empty state without progression', () => {
    setup({}, null);

    expect(screen.getByText('No progression found')).toBeInTheDocument();
  });
});
