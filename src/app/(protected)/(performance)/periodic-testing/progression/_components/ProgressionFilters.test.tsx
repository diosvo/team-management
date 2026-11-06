import {
  MOCK_PROGRESSION_TYPE,
  MOCK_PROGRESSION_TYPE_TIMED,
} from '@/test/mocks/progression';
import {
  mockUseQueryStates,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import { ProgressStatus } from '@/utils/enum';

import ProgressionFilters from './ProgressionFilters';

// The generic Filters component is covered by its own tests; capture the props
// and render the type select passed through `actions`.
const propsSpy = {
  filters: [] as Array<{ key: string; label: string }>,
  values: undefined as unknown,
  disabled: undefined as unknown,
  onApply: (() => {}) as (values: Record<string, unknown>) => void,
};

vi.mock('@/components/filters/Filters', () => ({
  default: (props: typeof propsSpy & { actions: React.ReactNode }) => {
    Object.assign(propsSpy, props);
    return <div>{props.actions}</div>;
  },
}));

describe('ProgressionFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (
    types = [MOCK_PROGRESSION_TYPE, MOCK_PROGRESSION_TYPE_TIMED],
    selected: string | null = MOCK_PROGRESSION_TYPE.type_id,
  ) => {
    mockUseQueryStates(
      { q: '', page: 1, type: '', status: [], band: [] },
      mockSetSearchParams,
    );
    return renderWithUI(
      <ProgressionFilters types={types} selected={selected} />,
    );
  };

  setupTestLifecycle();

  test('provides the trend and target filters', () => {
    setup();

    expect(propsSpy.filters.map(({ key, label }) => [key, label])).toEqual([
      ['status', 'Trend'],
      ['band', 'Target'],
    ]);
    expect(propsSpy.disabled).toBe(false);
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ status: [ProgressStatus.IMPROVING] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      status: [ProgressStatus.IMPROVING],
      page: 1,
    });
  });

  test('shows the selected type with its translated unit', () => {
    setup();

    expect(screen.getAllByText('Push-ups (Reps)').length).toBeGreaterThan(0);
  });

  test('switches the test type on the server', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('combobox'));
    await user.click(
      await screen.findByRole('option', { name: 'Sprint 30m (Seconds)' }),
    );

    await waitFor(() =>
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        { type: MOCK_PROGRESSION_TYPE_TIMED.type_id, page: 1 },
        { shallow: false },
      ),
    );
  });

  test('disables everything when there are no types', () => {
    setup([], null);

    expect(propsSpy.disabled).toBe(true);
    expect(screen.getByText('Test type')).toBeInTheDocument();
  });
});
