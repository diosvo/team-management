import {
  mockUseQueryStates,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import { Interval, SessionStatus } from '@/utils/enum';

import SessionFilters from './SessionFilters';

// The generic Filters component is covered by its own tests; capture the props
// SessionFilters wires through to it.
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

describe('SessionFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (values: Record<string, unknown> = {}) => {
    mockUseQueryStates(
      {
        page: 1,
        q: '',
        status: [],
        interval: Interval.THIS_MONTH,
        ...values,
      },
      mockSetSearchParams,
    );

    return renderWithUI(<SessionFilters />);
  };

  setupTestLifecycle();

  test('provides the interval and status filters', () => {
    setup();

    expect(propsSpy.filters).toMatchObject([
      { key: 'interval', label: 'Time' },
      { key: 'status', label: 'Status' },
    ]);
  });

  test('passes the committed values and defaults through', () => {
    setup({ status: [SessionStatus.COMPLETED] });

    expect(propsSpy.values).toMatchObject({
      status: [SessionStatus.COMPLETED],
    });
    expect(propsSpy.defaults).toMatchObject({
      status: [],
      interval: Interval.THIS_MONTH,
    });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ status: [SessionStatus.SCHEDULED] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      status: [SessionStatus.SCHEDULED],
      page: 1,
    });
  });
});
