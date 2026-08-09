import { Mock } from 'vitest';

import usePermissions from '@/hooks/use-permissions';

import { MOCK_ACHIEVEMENT } from '@/test/mocks/achievement';
import { renderWithUI, screen } from '@/test/utilities';
import { ESTABLISHED_DATE } from '@/utils/constants';
import { AchievementType } from '@/utils/enum';
import { formatDate } from '@/utils/formatter';

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

  test('groups achievements by year and captions the story so far', () => {
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
    // Captions run oldest-first, so the earliest year opens the story.
    expect(screen.getByText('Where It All Began.')).toBeInTheDocument();
    expect(screen.getByText('First Steps, Big Dreams.')).toBeInTheDocument();
  });

  test('quotes the first described honor of the year', () => {
    setup([
      buildAchievement({ achievement_id: 'a-1', year: 2025, description: null }),
      buildAchievement({
        achievement_id: 'a-2',
        year: 2025,
        description: 'We came, we fought, we conquered',
      }),
    ]);

    expect(
      screen.getByText('We came, we fought, we conquered'),
    ).toBeInTheDocument();
  });

  test('closes the timeline with the founding year when it has no honors', () => {
    setup([buildAchievement({ achievement_id: 'a-1', year: 2026 })]);

    expect(screen.getByText('Team Founded')).toBeInTheDocument();
    expect(screen.getByText(formatDate(ESTABLISHED_DATE))).toBeInTheDocument();
  });

  test('renders a row for every achievement', () => {
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
