import {
  createPermissionsMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import PageHeader, { AddButton } from './PageHeader';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

describe('PageHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);

  const setup = (canCreate = false, ui?: React.ReactNode) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ can: () => canCreate }),
    );

    return renderWithUI(<PageHeader title="Things">{ui}</PageHeader>);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const onClick = vi.fn();
    const { container } = setup(
      true,
      <AddButton resource="assets" onClick={onClick} />,
    );

    await expectNoA11yViolations(container);
  });

  test('renders the page title', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: /things/i }),
    ).toBeInTheDocument();
  });

  test('renders trailing actions when given', () => {
    setup(false, <button type="button">Custom</button>);

    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
  });

  describe('AddButton', () => {
    test('renders when the user can create the resource', () => {
      setup(true, <AddButton resource="assets" onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    test('hides when the user cannot create the resource', () => {
      setup(false, <AddButton resource="assets" onClick={vi.fn()} />);

      expect(
        screen.queryByRole('button', { name: /add/i }),
      ).not.toBeInTheDocument();
    });

    test('supports a custom label and forwards clicks', async () => {
      const onClick = vi.fn();
      const { user } = setup(
        true,
        <AddButton resource="training" onClick={onClick}>
          New Session
        </AddButton>,
      );

      await user.click(screen.getByRole('button', { name: /new session/i }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
