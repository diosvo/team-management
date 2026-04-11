'use client';

import usePermissions from '@/hooks/use-permissions';
import type { Action, Resource } from '@/utils/permissions';

type AuthorizedProps = {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
};

export default function Authorized({
  resource,
  action,
  children,
}: AuthorizedProps) {
  const { can } = usePermissions();

  return can(resource, action) ? children : null;
}
