import { axe } from 'jest-axe';
import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import TestingHeader from './TestingHeader';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

describe('TestingHeader', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => canCreate),
    });

    return renderWithUI(<TestingHeader />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should be accessible', async () => {
    const { container } = setup(true);

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('always renders the page title', () => {
    setup();

    expect(screen.getByText('Periodic Testing')).toBeInTheDocument();
  });

  test('renders the actions menu when the user can create', () => {
    setup(true);

    expect(
      screen.getByRole('button', { name: /actions/i }),
    ).toBeInTheDocument();
  });

  test('hides the actions menu when the user cannot create', () => {
    setup(false);

    expect(
      screen.queryByRole('button', { name: /actions/i }),
    ).not.toBeInTheDocument();
  });

  test('reveals the add-result and manage-test-types links when opened', async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole('button', { name: /actions/i }));

    expect(await screen.findByText('Add Result')).toBeInTheDocument();
    expect(screen.getByText('Manage Test Types')).toBeInTheDocument();
  });
});
