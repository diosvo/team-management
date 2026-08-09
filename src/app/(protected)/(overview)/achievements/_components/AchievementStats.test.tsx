import { axe } from 'jest-axe';

import { MOCK_ACHIEVEMENT } from '@/test/mocks/achievement';
import { renderWithUI, screen, within } from '@/test/utilities';
import { ESTABLISHED_DATE } from '@/utils/constants';
import { AchievementType } from '@/utils/enum';

import { AchievementWithRelations } from '@/db/achievement';

import AchievementStats from './AchievementStats';

const buildAchievement = (
  type: AchievementType,
): AchievementWithRelations => ({
  ...MOCK_ACHIEVEMENT,
  type,
  league: null,
  player: null,
});

describe('AchievementStats', () => {
  const achievements = [
    buildAchievement(AchievementType.CHAMPION),
    buildAchievement(AchievementType.RUNNER_UP),
    buildAchievement(AchievementType.MVP),
  ];

  const setup = (items = achievements) =>
    renderWithUI(<AchievementStats achievements={items} />);

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders all stat cards with their labels', () => {
    setup();

    expect(screen.getByText('Total Honors')).toBeInTheDocument();
    expect(screen.getByText('Championships')).toBeInTheDocument();
    expect(screen.getByText('Podium Finishes')).toBeInTheDocument();
    expect(screen.getByText('Years Active')).toBeInTheDocument();
  });

  // Values can collide across cards (e.g. "3" honors and "3" years active),
  // so each value is asserted within its own stat card.
  const statValue = (label: string) =>
    within(screen.getByText(label).closest('dl') as HTMLElement);

  test('computes the stat values from the achievements', () => {
    setup();

    // total: 3, championships: 1, podiums: 2 (champion + runner-up)
    expect(statValue('Total Honors').getByText('3')).toBeInTheDocument();
    expect(statValue('Championships').getByText('1')).toBeInTheDocument();
    expect(statValue('Podium Finishes').getByText('2')).toBeInTheDocument();
  });

  test('derives years active from the establishment date', () => {
    setup([]);

    const yearsActive =
      new Date().getFullYear() - new Date(ESTABLISHED_DATE).getFullYear() + 1;
    expect(
      statValue('Years Active').getByText(String(yearsActive)),
    ).toBeInTheDocument();
  });
});
