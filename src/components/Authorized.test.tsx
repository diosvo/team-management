import { createPermissionsMock, render, screen } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import Authorized from './Authorized';

vi.mock('@/hooks/use-permissions', () => ({ default: vi.fn() }));

describe('Authorized', () => {
  const mockUsePermissions = vi.mocked(usePermissions);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (
    permissions: Partial<ReturnType<typeof usePermissions>> = {},
    props: Partial<React.ComponentProps<typeof Authorized>> = {},
  ) => {
    mockUsePermissions.mockReturnValue(createPermissionsMock(permissions));

    return render(
      <Authorized resource="roster" action="view" {...props}>
        <span>Protected content</span>
      </Authorized>,
    );
  };

  test('renders children when the user has permission', () => {
    setup({ can: () => true });

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('renders nothing when the user lacks permission', () => {
    setup({ can: () => false });

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('passes the correct resource and action to can()', () => {
    const can = vi.fn(() => true);

    setup({ can }, { resource: 'attendance', action: 'create' });

    expect(can).toHaveBeenCalledWith('attendance', 'create');
  });

  test('renders the fallback when the user lacks permission', () => {
    setup({ can: () => false }, { fallback: <span>Not allowed</span> });

    expect(screen.getByText('Not allowed')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders the loading node while permissions are unresolved', () => {
    setup(
      { isLoading: true, can: () => true },
      { loading: <span>Checking...</span> },
    );

    expect(screen.getByText('Checking...')).toBeInTheDocument();
    // The permission result is not consulted until loading settles.
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('renders nothing while loading when no loading node is given', () => {
    const { container } = setup({ isLoading: true, can: () => true });

    expect(container).toBeEmptyDOMElement();
  });

  describe('multiple actions', () => {
    const actions = ['view', 'edit'] as const;

    test('requires every permission in the default "all" mode', () => {
      const canAll = vi.fn(() => true);

      setup({ canAll }, { action: [...actions] });

      expect(canAll).toHaveBeenCalledWith(['roster:view', 'roster:edit']);
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    test('hides the children when "all" mode is not satisfied', () => {
      setup({ canAll: () => false }, { action: [...actions] });

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    test('requires a single permission in "any" mode', () => {
      const canAny = vi.fn(() => true);

      setup({ canAny }, { action: [...actions], mode: 'any' });

      expect(canAny).toHaveBeenCalledWith(['roster:view', 'roster:edit']);
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    test('falls back to can() when the array holds a single action', () => {
      const can = vi.fn(() => true);
      const canAll = vi.fn(() => false);

      setup({ can, canAll }, { action: ['edit'] });

      expect(can).toHaveBeenCalledWith('roster', 'edit');
      expect(canAll).not.toHaveBeenCalled();
    });
  });
});
