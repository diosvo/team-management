import {
  mockUseQueryStates,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import { TestTypeUnit } from '@/utils/enum';

import TestTypesFilters from './TestTypesFilters';

// The generic Filters component is covered by its own tests; capture the props
// TestTypesFilters wires through to it.
const propsSpy = {
  filters: [] as Array<{ key: string }>,
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

describe('TestTypesFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (values: Record<string, unknown> = {}) => {
    mockUseQueryStates(
      { page: 1, q: '', unit: [], ...values },
      mockSetSearchParams,
    );

    return renderWithUI(<TestTypesFilters />);
  };

  const filterKeys = () => propsSpy.filters.map(({ key }) => key);

  setupTestLifecycle();

  test('provides the unit filter', () => {
    setup();

    expect(filterKeys()).toContain('unit');
  });

  test('passes the committed values and defaults through', () => {
    setup({ unit: [TestTypeUnit.SECONDS] });

    expect(propsSpy.values).toMatchObject({ unit: [TestTypeUnit.SECONDS] });
    expect(propsSpy.defaults).toMatchObject({ unit: [] });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ unit: [TestTypeUnit.REPS] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      unit: [TestTypeUnit.REPS],
      page: 1,
    });
  });
});
