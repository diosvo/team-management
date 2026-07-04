import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import { UpsertTestType } from './UpsertTestType';
import TestTypesHeader from './TestTypesHeader';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

// The dialog is exercised by its own test; stub the overlay controller so we
// can assert the header opens it in "Add" mode.
vi.mock('./UpsertTestType', () => ({
  UpsertTestType: { open: vi.fn() },
}));

describe('TestTypesHeader', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockOpen = UpsertTestType.open as unknown as Mock;

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => canCreate),
    });

    return renderWithUI(<TestTypesHeader />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Test Types')).toBeInTheDocument();
  });

  test('renders the back link to periodic testing', () => {
    setup();

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '../periodic-testing',
    );
  });

  test('renders the add button when the user can create', () => {
    setup(true);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('hides the add button when the user cannot create', () => {
    setup(false);

    expect(
      screen.queryByRole('button', { name: /add/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in add mode when the add button is clicked', async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockOpen).toHaveBeenCalledWith('add-test-type', {
      action: 'Add',
      item: { type_id: '' },
    });
  });
});
