import { Mock } from 'vitest';

import { act, renderWithUI, screen, waitFor } from '@/test/utilities';

import { upsertAchievement } from '@/actions/achievement';

import { UpsertAchievement } from './UpsertAchievement';

vi.mock('@/actions/achievement', () => ({
  upsertAchievement: vi.fn(),
  getPlayerLeagueStatSuggestions: vi.fn(() => []),
}));

vi.mock('@/actions/league', () => ({
  getLeagues: vi.fn(() => []),
}));

vi.mock('@/actions/user', () => ({
  getActivePlayers: vi.fn(() => []),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(() => 'toast-id'),
    update: vi.fn(),
  },
}));

describe('UpsertAchievement', () => {
  const mockUpsertAchievement = upsertAchievement as unknown as Mock;

  const open = async (
    action: 'Add' | 'Update' = 'Add',
    item: Record<string, unknown> = { achievement_id: '' },
  ) => {
    const view = renderWithUI(<UpsertAchievement.Viewport />);

    const id = action === 'Update' ? 'update-achievement' : 'add-achievement';
    await act(async () => {
      UpsertAchievement.open(id, { action, item });
    });

    return view;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      UpsertAchievement.removeAll();
    });
  });

  test('renders the dialog title and main fields for the given action', async () => {
    await open('Add');

    expect(await screen.findByText('Add Achievement')).toBeInTheDocument();
    expect(screen.getAllByText('Type').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Title').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Year').length).toBeGreaterThan(0);
  });

  test('submits the achievement through upsertAchievement', async () => {
    mockUpsertAchievement.mockResolvedValue({
      success: true,
      message: 'Saved',
    });

    const { user } = await open('Update', {
      achievement_id: 'achievement-123',
      type: 'champion',
      title: 'Summer Champions',
      year: 2024,
      league_id: null,
      player_id: null,
      description: '',
    });

    const submit = await screen.findByRole('button', { name: /update/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => {
      expect(mockUpsertAchievement).toHaveBeenCalledWith(
        'achievement-123',
        expect.objectContaining({
          type: 'champion',
          title: 'Summer Champions',
          year: 2024,
          player_id: null,
        }),
      );
    });
  });
});
