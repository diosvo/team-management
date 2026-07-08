import useSWRImmutable from 'swr/immutable';

import { getAvatar as getUserAvatar } from '@/actions/user';

export function useUserAvatar(image: Nullable<string>) {
  return useSWRImmutable(image ? ['user-avatar', image] : null, () =>
    getUserAvatar(image),
  );
}
