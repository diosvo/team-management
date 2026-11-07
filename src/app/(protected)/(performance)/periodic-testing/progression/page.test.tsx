import { loadProgressionFilters } from '@/lib/nuqs';

import { getProgression } from '@/actions/progression';
import { MOCK_TYPE_PROGRESSION } from '@/test/mocks/progression';
import { renderWithUI, screen, setupTestLifecycle } from '@/test/utilities';

import ProgressionPage, { generateMetadata } from './page';

vi.mock('@/actions/progression', () => ({
  getProgression: vi.fn(),
}));

vi.mock('@/lib/nuqs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/nuqs')>()),
  loadProgressionFilters: vi.fn(),
}));

// Child components are covered by their own tests; capture the wired props.
const propsSpy = {
  stats: undefined as unknown,
  filters: undefined as unknown,
  table: undefined as unknown,
};

vi.mock('./_components/ProgressionHeader', () => ({
  default: () => <div data-testid="header" />,
}));
vi.mock('./_components/ProgressionStats', () => ({
  default: (props: unknown) => {
    propsSpy.stats = props;
    return <div data-testid="stats" />;
  },
}));
vi.mock('./_components/ProgressionFilters', () => ({
  default: (props: unknown) => {
    propsSpy.filters = props;
    return <div data-testid="filters" />;
  },
}));
vi.mock('./_components/ProgressionTable', () => ({
  default: (props: unknown) => {
    propsSpy.table = props;
    return <div data-testid="table" />;
  },
}));

describe('ProgressionPage', () => {
  const mockLoadFilters = vi.mocked(loadProgressionFilters);
  const mockGetProgression = vi.mocked(getProgression);

  const setup = async () => {
    const searchParams = Promise.resolve({});
    const ui = await ProgressionPage({
      params: Promise.resolve({}),
      searchParams,
    } as Parameters<typeof ProgressionPage>[0]);

    return { ...renderWithUI(ui), searchParams };
  };

  setupTestLifecycle();

  beforeEach(() => {
    mockLoadFilters.mockResolvedValue({
      q: '',
      page: 1,
      type: 'type-reps',
      status: [],
      band: [],
    } as never);
  });

  test('exposes page metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Performance Progression');
    expect(metadata.description).toBe(
      'Track how each player develops across periodic tests',
    );
  });

  test('renders every section with the fetched progression', async () => {
    const types = [MOCK_TYPE_PROGRESSION.type];
    mockGetProgression.mockResolvedValue({
      types,
      progression: MOCK_TYPE_PROGRESSION,
    });

    const { searchParams } = await setup();

    expect(mockLoadFilters).toHaveBeenCalledWith(searchParams);
    expect(mockGetProgression).toHaveBeenCalledWith('type-reps');
    ['header', 'stats', 'filters', 'table'].forEach((id) =>
      expect(screen.getByTestId(id)).toBeInTheDocument(),
    );
    expect(propsSpy.stats).toEqual({ progression: MOCK_TYPE_PROGRESSION });
    expect(propsSpy.filters).toEqual({
      types,
      selected: MOCK_TYPE_PROGRESSION.type.type_id,
    });
    expect(propsSpy.table).toEqual({ progression: MOCK_TYPE_PROGRESSION });
  });

  test('passes no selected type when there is no progression', async () => {
    mockGetProgression.mockResolvedValue({ types: [], progression: null });

    await setup();

    expect(propsSpy.filters).toEqual({ types: [], selected: null });
  });
});
