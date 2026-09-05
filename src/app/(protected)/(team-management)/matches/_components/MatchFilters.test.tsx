import {
  mockUseQueryStates,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import { Interval, MatchType } from '@/utils/enum';

import MatchFilters from './MatchFilters';

// The generic Filters component is covered by its own tests; capture the props
// MatchFilters wires through to it.
const propsSpy = {
  filters: [] as Array<{ key: string; label: string }>,
  values: undefined as unknown,
  defaults: undefined as unknown,
  onApply: (() => {}) as (values: Record<string, unknown>) => void,
};

vi.mock('@/components/filters/Filters', () => ({
  default: (props: typeof propsSpy) => {
    Object.assign(propsSpy, props);
    return <div>Filters</div>;
  },
}));

describe('MatchFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (values: Record<string, unknown> = {}) => {
    mockUseQueryStates(
      {
        page: 1,
        q: '',
        game_type: [],
        match_type: [],
        interval: Interval.THIS_YEAR,
        ...values,
      },
      mockSetSearchParams,
    );

    return renderWithUI(<MatchFilters />);
  };

  setupTestLifecycle();

  test('provides the interval, game type and match type filters', () => {
    setup();

    expect(propsSpy.filters).toMatchObject([
      { key: 'interval', label: 'Time' },
      { key: 'game_type', label: 'Game Type' },
      { key: 'match_type', label: 'Match Type' },
    ]);
  });

  test('passes the committed values and defaults through', () => {
    setup({ match_type: [MatchType.LEAGUE] });

    expect(propsSpy.values).toMatchObject({ match_type: [MatchType.LEAGUE] });
    expect(propsSpy.defaults).toMatchObject({
      game_type: [],
      match_type: [],
      interval: Interval.THIS_YEAR,
    });
  });

  test('resets to the first page and refetches on the server when applied', () => {
    setup();

    propsSpy.onApply({ interval: Interval.THIS_MONTH });

    expect(mockSetSearchParams).toHaveBeenCalledWith(
      { interval: Interval.THIS_MONTH, page: 1 },
      { shallow: false },
    );
  });
});
