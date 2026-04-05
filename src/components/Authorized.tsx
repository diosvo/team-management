'use client';

import { usePathname } from 'next/navigation';

import usePermissions from '@/hooks/use-permissions';
import type { Action, Resource } from '@/utils/permissions';

type AuthorizedProps = {
  action: Action;
  children: React.ReactNode;
};

export default function Authorized({ action, children }: AuthorizedProps) {
  const { can } = usePermissions();
  const pathname = usePathname();

  const resource = pathname.split('/')[1] as Resource;

  return can(resource, action) ? children : null;
}
