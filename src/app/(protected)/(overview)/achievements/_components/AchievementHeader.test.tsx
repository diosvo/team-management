import { Mock } from 'vitest';

import usePermissions from '@/hooks/use-permissions';

import { renderWithUI, screen } from '@/test/utilities';

import AchievementHeader from './AchievementHeader';
import { UpsertAchievement } from './UpsertAchievement';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

// The dialog is exercised by its own test; stub the overlay controller so we
// can assert the header opens it in "Add" mode.
vi.mock('./UpsertAchievement', () => ({
  UpsertAchievement: Object.assign({ open: vi.fn() }, { Viewport: () => null }),
}));

describe('AchievementHeader', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockOpen = UpsertAchievement.open as unknown as Mock;

  const setup = ({ canCreate = false } = {}) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => canCreate),
    });

    return renderWithUI(<AchievementHeader />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the record button when the user can create', () => {
    setup({ canCreate: true });

    expect(screen.getByRole('button', { name: /record/i })).toBeInTheDocument();
  });

  test('hides the record button when the user cannot create', () => {
    setup();

    expect(
      screen.queryByRole('button', { name: /record/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in add mode when the record button is clicked', async () => {
    const { user } = setup({ canCreate: true });

    await user.click(screen.getByRole('button', { name: /record/i }));

    expect(mockOpen).toHaveBeenCalledWith('add-achievement', {
      action: 'Add',
      item: { achievement_id: '' },
    });
  });

  test('does not open the dialog until the record button is clicked', () => {
    setup({ canCreate: true });

    expect(mockOpen).not.toHaveBeenCalled();
  });
});
