import * as nuqs from 'nuqs';
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
  UpsertAchievement: Object.assign(
    { open: vi.fn() },
    { Viewport: () => null },
  ),
}));

describe('AchievementHeader', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockOpen = UpsertAchievement.open as unknown as Mock;
  const mockSetSearchParams = vi.fn();

  const setup = ({ canCreate = false, record = '' } = {}) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => canCreate),
    });
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { record },
      mockSetSearchParams,
    ]);

    return renderWithUI(<AchievementHeader />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  test('renders the record button when the user can create', () => {
    setup({ canCreate: true });

    expect(
      screen.getByRole('button', { name: /record/i }),
    ).toBeInTheDocument();
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

  test('opens the dialog pre-filled from the record search param', () => {
    setup({ record: 'league-123' });

    expect(mockOpen).toHaveBeenCalledWith('add-achievement', {
      action: 'Add',
      item: { achievement_id: '', league_id: 'league-123' },
    });
    expect(mockSetSearchParams).toHaveBeenCalledWith({ record: '' });
  });
});
