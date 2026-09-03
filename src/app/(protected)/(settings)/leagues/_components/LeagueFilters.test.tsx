import {
  mockUseQueryStates,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import { LeagueStatus } from '@/utils/enum';

import LeagueFilters from './LeagueFilters';

// The generic Filters component is covered by its own tests; capture the props
// LeagueFilters wires through to it.
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

describe('LeagueFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (values: Record<string, unknown> = {}) => {
    mockUseQueryStates(
      { page: 1, q: '', status: [], ...values },
      mockSetSearchParams,
    );

    return renderWithUI(<LeagueFilters />);
  };

  setupTestLifecycle();

  test('provides the status filter', () => {
    setup();

    expect(propsSpy.filters).toMatchObject([{ key: 'status', label: 'Status' }]);
  });

  test('passes the committed values and defaults through', () => {
    setup({ status: [LeagueStatus.UPCOMING] });

    expect(propsSpy.values).toMatchObject({ status: [LeagueStatus.UPCOMING] });
    expect(propsSpy.defaults).toMatchObject({ status: [] });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ status: [LeagueStatus.ONGOING] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      status: [LeagueStatus.ONGOING],
      page: 1,
    });
  });
});
