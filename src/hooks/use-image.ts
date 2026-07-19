import useSWRImmutable from 'swr/immutable';

import { getLogo as getTeamLogo } from '@/actions/team';
import { getAvatar as getUserAvatar } from '@/actions/user';

export function useUserAvatar(image: Nullish<string>) {
  return useSWRImmutable(image ? ['user-avatar', image] : null, () =>
    getUserAvatar(image),
  );
}

export function useTeamLogo(image: Nullish<string>) {
  return useSWRImmutable(image ? ['team-avatar', image] : null, () =>
    getTeamLogo(image),
  );
}
