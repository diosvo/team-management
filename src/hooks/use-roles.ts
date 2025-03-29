'use client';

import useCurrentUser from './use-current-user';

export default function useRoles() {
  const user = useCurrentUser();

  return user?.roles;
}
