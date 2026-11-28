import { CoachPosition, PlayerPosition, UserRole } from '@/utils/enum';

import type { User } from '@/drizzle/schema';
import { enumLabel } from '@/i18n/enums';

/**
 * Position label for the profile's own role, `null` for admins and guests.
 * Short ("PF") by default; pass `enumFullLabel` for the full name.
 */
export function positionLabel(
  t: Parameters<typeof enumLabel>[0],
  user: User,
  label: typeof enumLabel = enumLabel,
): Nullable<string> {
  if (user.role === UserRole.PLAYER) {
    return label(
      t,
      'playerPosition',
      user.player?.position ?? PlayerPosition.UNKNOWN,
    );
  }
  if (user.role === UserRole.COACH) {
    return label(
      t,
      'coachPosition',
      user.coach?.position ?? CoachPosition.UNKNOWN,
    );
  }
  return null;
}
