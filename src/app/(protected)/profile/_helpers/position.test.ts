import { CoachPosition, PlayerPosition, UserRole } from '@/utils/enum';

import type { enumLabel } from '@/i18n/enums';
import {
  MOCK_COACH,
  MOCK_PLAYER,
  MOCK_USER,
  MOCK_USER_WITH_COACH,
  MOCK_USER_WITH_PLAYER,
} from '@/test/mocks/user';

import { positionLabel } from './position';

vi.mock('@/i18n/enums', () => ({
  enumLabel: vi.fn((_t, group: string, value: string) => `${group}:${value}`),
}));

describe('positionLabel', () => {
  const t = {} as Parameters<typeof enumLabel>[0];

  test('labels a player by their position', () => {
    expect(positionLabel(t, MOCK_USER_WITH_PLAYER)).toBe(
      `playerPosition:${MOCK_PLAYER.position}`,
    );
  });

  test('labels a coach by their position, not the player one', () => {
    expect(
      positionLabel(t, { ...MOCK_USER_WITH_COACH, role: UserRole.COACH }),
    ).toBe(`coachPosition:${MOCK_COACH.position}`);
  });

  test.each([
    ['player', UserRole.PLAYER, `playerPosition:${PlayerPosition.UNKNOWN}`],
    ['coach', UserRole.COACH, `coachPosition:${CoachPosition.UNKNOWN}`],
  ])('falls back to unknown for a %s without a role row', (_, role, label) => {
    expect(positionLabel(t, { ...MOCK_USER, role })).toBe(label);
  });

  test('uses the given labeller, e.g. enumFullLabel for the full name', () => {
    const full = vi.fn(() => 'Shooting Guard');

    expect(positionLabel(t, MOCK_USER_WITH_PLAYER, full)).toBe(
      'Shooting Guard',
    );
    expect(full).toHaveBeenCalledWith(
      t,
      'playerPosition',
      MOCK_PLAYER.position,
    );
  });

  test.each([UserRole.SUPER_ADMIN, UserRole.GUEST])(
    'has no position for %s',
    (role) => {
      expect(positionLabel(t, { ...MOCK_USER, role })).toBeNull();
    },
  );
});
