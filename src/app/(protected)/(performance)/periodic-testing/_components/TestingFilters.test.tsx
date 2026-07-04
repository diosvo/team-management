import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { MOCK_TEST_RESULT_DATE } from '@/test/mocks/periodic-testing';
import { renderWithUI, screen } from '@/test/utilities';

import TestingFilters from './TestingFilters';

// The generic Filters component is covered by its own tests; capture the props
// TestingFilters wires through to it and render the `actions` (date select).
const propsSpy = {
  filters: [] as Array<unknown>,
  values: undefined as unknown,
  defaults: undefined as unknown,
  disabled: undefined as unknown,
  onApply: (() => {}) as (values: Record<string, unknown>) => void,
};

vi.mock('@/components/filters/Filters', () => ({
  default: (props: typeof propsSpy & { actions: React.ReactNode }) => {
    Object.assign(propsSpy, props);
    return <div>{props.actions}</div>;
  },
}));

describe('TestingFilters', () => {
  const mockSetSearchParams = vi.fn();

  const setup = ({
    dates = [MOCK_TEST_RESULT_DATE],
    params = {},
  }: {
    dates?: Array<string>;
    params?: Record<string, unknown>;
  } = {}) => {
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1, q: '', date: '', type: [], ...params },
      mockSetSearchParams,
    ]);

    return renderWithUI(<TestingFilters dates={dates} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the date select placeholder', () => {
    setup();

    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  test('passes the committed values and defaults through to Filters', () => {
    setup({ params: { date: MOCK_TEST_RESULT_DATE } });

    expect(propsSpy.values).toMatchObject({ date: MOCK_TEST_RESULT_DATE });
    expect(propsSpy.defaults).toMatchObject({ date: '', type: [] });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ type: ['Sprint 30m'] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      type: ['Sprint 30m'],
      page: 1,
    });
  });

  test('disables the controls when there are no dates', () => {
    setup({ dates: [] });

    expect(propsSpy.disabled).toBe(true);
  });

  test('enables the controls when dates are available', () => {
    setup();

    expect(propsSpy.disabled).toBe(false);
  });
});
