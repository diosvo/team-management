import {
  createPermissionsMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import ProgressionHeader from './ProgressionHeader';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

describe('ProgressionHeader', () => {
  const setup = (canCreate = false) => {
    vi.mocked(usePermissions).mockReturnValue(
      createPermissionsMock({ can: vi.fn(() => canCreate) }),
    );

    return renderWithUI(<ProgressionHeader />);
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup(true);

    await expectNoA11yViolations(container);
  });

  test('links back to the results for everyone', () => {
    setup();

    expect(screen.getByText('Performance Progression')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /results/i })).toHaveAttribute(
      'href',
      '/periodic-testing',
    );
    expect(
      screen.queryByRole('link', { name: /manage types/i }),
    ).not.toBeInTheDocument();
  });

  test('shows the manage types link to users who can create', () => {
    setup(true);

    expect(screen.getByRole('link', { name: /manage types/i })).toHaveAttribute(
      'href',
      '/periodic-testing/test-types',
    );
  });
});
