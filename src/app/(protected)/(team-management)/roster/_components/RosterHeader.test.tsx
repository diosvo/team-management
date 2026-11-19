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

// The add-user dialog is exercised by its own test; render a marker here.
vi.mock('./AddUser', () => ({
  default: () => <div>AddUser</div>,
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

  test('renders the add-user control when the user can create', () => {
    setup(true);

    expect(screen.getByText('AddUser')).toBeInTheDocument();
  });

  test('hides the add-user control when the user cannot create', () => {
    setup(false);

    expect(screen.queryByText('AddUser')).not.toBeInTheDocument();
  });

  // The export gates itself on super admin or captain.
  test('always mounts the jersey form export', () => {
    setup(false);

    expect(screen.getByText('JerseyOrderExport')).toBeInTheDocument();
  });
});
