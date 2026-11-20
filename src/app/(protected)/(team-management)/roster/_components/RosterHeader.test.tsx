import usePermissions from '@/hooks/use-permissions';
import {
  createPermissionsMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import RosterHeader from './RosterHeader';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('./JerseyOrderExport', () => ({
  default: () => <div>JerseyOrderExport</div>,
}));

describe('RosterHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({
        can: vi.fn(() => canCreate),
      }),
    );

    return renderWithUI(<RosterHeader users={[]} />);
  };

  setupTestLifecycle();

  test('renders the roster page title', () => {
    setup();

    expect(screen.getByText('Team Roster')).toBeInTheDocument();
  });

  // Members are added on the Accounts page now
  test('has no add-user control, even for admins', () => {
    setup(true);

    expect(
      screen.queryByRole('button', { name: /Add/ }),
    ).not.toBeInTheDocument();
  });

  // The export gates itself on super admin or captain.
  test('always mounts the jersey form export', () => {
    setup(false);

    expect(screen.getByText('JerseyOrderExport')).toBeInTheDocument();
  });
});
