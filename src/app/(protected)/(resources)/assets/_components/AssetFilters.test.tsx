import {
  mockUseQueryStates,
  renderWithUI,
  setupTestLifecycle,
} from '@/test/utilities';

import { AssetCategory, AssetCondition } from '@/utils/enum';

import AssetFilters from './AssetFilters';

// The generic Filters component is covered by its own tests; capture the props
// AssetFilters wires through to it.
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

describe('AssetFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = (values: Record<string, unknown> = {}) => {
    mockUseQueryStates(
      { page: 1, q: '', category: [], condition: [], ...values },
      mockSetSearchParams,
    );

    return renderWithUI(<AssetFilters />);
  };

  setupTestLifecycle();

  test('provides the category and condition filters', () => {
    setup();

    expect(propsSpy.filters).toMatchObject([
      { key: 'category', label: 'Category' },
      { key: 'condition', label: 'Condition' },
    ]);
  });

  test('passes the committed values and defaults through', () => {
    setup({ category: [AssetCategory.EQUIPMENT] });

    expect(propsSpy.values).toMatchObject({
      category: [AssetCategory.EQUIPMENT],
    });
    expect(propsSpy.defaults).toMatchObject({ category: [], condition: [] });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ condition: [AssetCondition.GOOD] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      condition: [AssetCondition.GOOD],
      page: 1,
    });
  });
});
