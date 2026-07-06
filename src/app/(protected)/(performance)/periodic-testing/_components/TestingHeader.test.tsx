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

  test('renders the action links when the user can create', () => {
    setup(true);

    expect(
      screen.getByRole('link', { name: /add result/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /manage types/i }),
    ).toBeInTheDocument();
  });

  test('hides the action links when the user cannot create', () => {
    setup(false);

    expect(
      screen.queryByRole('link', { name: /add result/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /manage types/i }),
    ).not.toBeInTheDocument();
  });

  test('points the action links at the add-result and test-types pages', () => {
    setup(true);

    expect(screen.getByRole('link', { name: /add result/i })).toHaveAttribute(
      'href',
      '/periodic-testing/add-result',
    );
    expect(
      screen.getByRole('link', { name: /manage types/i }),
    ).toHaveAttribute('href', '/periodic-testing/test-types');
  });
});
