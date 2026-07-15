import useSWRImmutable from 'swr/immutable';

import { getAvatar as getUserAvatar } from '@/actions/user';

export function useUserAvatar(image: Nullable<string>) {
  return useSWRImmutable(image ? ['user-avatar', image] : null, () =>
    getUserAvatar(image),
  );
}

import useSWRImmutable from 'swr/immutable';

import { getLogo as getTeamLogo } from '@/actions/team';

export function useTeamLogo(image: Image) {
  return useSWRImmutable(image ? ['team-avatar', image] : null, () =>
    getTeamLogo(image),
  );
}
