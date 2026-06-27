import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { renderWithUI } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';
import { UserState } from '@/utils/enum';

import RosterFilters from './RosterFilters';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

// The generic Filters component is covered by its own tests; capture the props
// RosterFilters wires through to it.
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

describe('RosterFilters', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockSetSearchParams = vi.fn();

  const setup = (
    perms: Record<string, boolean> = {},
    values: Record<string, unknown> = {},
  ) => {
    mockUsePermissions.mockReturnValue({
      isAdmin: false,
      isCaptain: false,
      ...perms,
    });
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1, q: '', role: [], state: [], ...values },
      mockSetSearchParams,
    ]);

    return renderWithUI(<RosterFilters />);
  };

  const filterKeys = () => propsSpy.filters.map(({ key }) => key);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('always provides the state filter', () => {
    setup();

    expect(filterKeys()).toContain('state');
  });

  test('omits the role filter for non-managers', () => {
    setup();

    expect(filterKeys()).not.toContain('role');
  });

  test('includes the role filter for admins', () => {
    setup({ isAdmin: true });

    expect(filterKeys()).toContain('role');
  });

  test('includes the role filter for captains', () => {
    setup({ isCaptain: true });

    expect(filterKeys()).toContain('role');
  });

  test('passes the committed values and defaults through', () => {
    setup({}, { state: [UserState.ACTIVE] });

    expect(propsSpy.values).toMatchObject({ state: [UserState.ACTIVE] });
    expect(propsSpy.defaults).toMatchObject({ role: [], state: [] });
  });

  test('resets to the first page when filters are applied', () => {
    setup();

    propsSpy.onApply({ state: [UserState.ACTIVE] });

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      state: [UserState.ACTIVE],
      page: 1,
    });
  });
});
