import { Mock } from 'vitest';

import usePermissions from '@/hooks/use-permissions';

import { MOCK_ACHIEVEMENT } from '@/test/mocks/achievement';
import { renderWithUI, screen } from '@/test/utilities';
import { AchievementType } from '@/utils/enum';

import { AchievementWithRelations } from '@/db/achievement';

import AchievementTimeline from './AchievementTimeline';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/actions/achievement', () => ({
  removeAchievement: vi.fn(),
}));

vi.mock('./UpsertAchievement', () => ({
  UpsertAchievement: { open: vi.fn() },
}));

const buildAchievement = (
  overrides: Partial<AchievementWithRelations>,
): AchievementWithRelations => ({
  ...MOCK_ACHIEVEMENT,
  league: null,
  player: null,
  ...overrides,
});

describe('AchievementTimeline', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;

  const setup = (achievements: Array<AchievementWithRelations>) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => false),
    });

    return renderWithUI(<AchievementTimeline achievements={achievements} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the empty state when there are no achievements', () => {
    setup([]);

    expect(
      screen.getByText('The trophy cabinet awaits its first honor'),
    ).toBeInTheDocument();
  });

  test('groups achievements by year with a pluralized count', () => {
    setup([
      buildAchievement({ achievement_id: 'a-1', year: 2025 }),
      buildAchievement({
        achievement_id: 'a-2',
        year: 2025,
        type: AchievementType.MVP,
        title: 'MVP',
      }),
      buildAchievement({ achievement_id: 'a-3', year: 2024 }),
    ]);

    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2 honors')).toBeInTheDocument();
    expect(screen.getByText('1 honor')).toBeInTheDocument();
  });

  test('renders a card for every achievement', () => {
    setup([
      buildAchievement({
        achievement_id: 'a-1',
        year: 2025,
        title: 'City Championship',
      }),
      buildAchievement({
        achievement_id: 'a-2',
        year: 2024,
        type: AchievementType.TOP_SCORER,
        title: 'Scoring King',
      }),
    ]);

    expect(screen.getByText('City Championship')).toBeInTheDocument();
    expect(screen.getByText('Scoring King')).toBeInTheDocument();
  });
});
