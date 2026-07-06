import { axe } from 'jest-axe';
import { Mock } from 'vitest';

import {
  MOCK_TEST_RESULT_DATE,
  MOCK_TEST_RESULT_RESPONSE,
} from '@/test/mocks/periodic-testing';
import { renderWithUI, screen } from '@/test/utilities';

import { getTestDates, getTestResult } from '@/actions/test-result';
import { loadPeriodicTestingFilters } from '@/lib/nuqs';

import PeriodicTestingPage, { metadata } from './page';

vi.mock('@/actions/test-result', () => ({
  getTestResult: vi.fn(),
  getTestDates: vi.fn(),
}));

vi.mock('@/lib/nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/nuqs')>()),
  loadPeriodicTestingFilters: vi.fn(),
}));

// Child components are covered by their own tests; render markers here and
// capture the props the page wires through to them.
const propsSpy = {
  stats: undefined as unknown,
  filters: undefined as unknown,
  matrix: undefined as unknown,
};

vi.mock('./_components/TestingHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/TestingStats', () => ({
  default: (props: unknown) => {
    propsSpy.stats = props;
    return <div data-testid="stats" />;
  },
}));
vi.mock('./_components/TestingFilters', () => ({
  default: (props: unknown) => {
    propsSpy.filters = props;
    return <div data-testid="filters" />;
  },
}));
vi.mock('./_components/PlayerPerformanceMatrix', () => ({
  default: (props: unknown) => {
    propsSpy.matrix = props;
    return <div data-testid="matrix" />;
  },
}));

const MOCK_DATE = MOCK_TEST_RESULT_DATE;

describe('PeriodicTestingPage', () => {
  const mockLoadFilters = loadPeriodicTestingFilters as unknown as Mock;
  const mockGetResult = getTestResult as unknown as Mock;
  const mockGetDates = getTestDates as unknown as Mock;

  const setup = async (searchParams: Record<string, unknown> = {}) => {
    const searchParamsPromise = Promise.resolve(searchParams);
    const props = {
      params: Promise.resolve({}),
      searchParams: searchParamsPromise,
    } as Parameters<typeof PeriodicTestingPage>[0];

    const ui = await PeriodicTestingPage(props);

    return { ...renderWithUI(ui), searchParamsPromise };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFilters.mockResolvedValue({
      q: '',
      page: 1,
      date: MOCK_DATE,
      type: [],
    });
    mockGetResult.mockResolvedValue(MOCK_TEST_RESULT_RESPONSE);
    mockGetDates.mockResolvedValue([MOCK_DATE]);
  });

  test('exposes page metadata', () => {
    expect(metadata.title).toBe('Periodic Testing');
    expect(metadata.description).toBe(
      'Performance testing and analytics for team players',
    );
  });

  test('should be accessible', async () => {
    const { container } = await setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders every section', async () => {
    await setup();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('stats')).toBeInTheDocument();
    expect(screen.getByTestId('filters')).toBeInTheDocument();
    expect(screen.getByTestId('matrix')).toBeInTheDocument();
  });

  test('loads filters from the incoming search params', async () => {
    const { searchParamsPromise } = await setup({ date: MOCK_DATE });

    expect(mockLoadFilters).toHaveBeenCalledWith(searchParamsPromise);
  });

  test('fetches the result for the resolved date and the available dates', async () => {
    await setup();

    expect(mockGetResult).toHaveBeenCalledWith(MOCK_DATE);
    expect(mockGetDates).toHaveBeenCalled();
  });

  test('derives the stats from the fetched result', async () => {
    await setup();

    expect(propsSpy.stats).toEqual({
      stats: {
        completed_tests: MOCK_TEST_RESULT_RESPONSE.headers.length,
        total_players: MOCK_TEST_RESULT_RESPONSE.players.length,
      },
    });
  });

  test('passes the dates to the filters', async () => {
    await setup();

    expect(propsSpy.filters).toEqual({
      dates: [MOCK_DATE],
    });
  });

  test('passes the fetched result to the matrix', async () => {
    await setup();

    expect(propsSpy.matrix).toEqual({ result: MOCK_TEST_RESULT_RESPONSE });
  });
});
