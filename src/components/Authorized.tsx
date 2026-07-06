'use client';

/**
 * Support:
 *
 * - `fallback`: what to render when the user is NOT allowed (default: `null`)
 * - `loading`: what to render while permissions are unresolved
 *              (only ever shown when there was no server session)
 * - `actions`: optional array form, checked with every/some semantics
 */

import usePermissions from '@/hooks/use-permissions';
import type { Action, Resource } from '@/utils/permissions';

type AuthorizedProps = Required<{
  resource: Resource;
  /** single action, or several */
  action: Action | Array<Action>;
  children: React.ReactNode;
}> &
  Partial<{
    /** when several actions are given: must the user have all of them or any? */
    mode: 'all' | 'any';
    /** rendered while permissions are still resolving (e.g., a Skeleton) */
    loading: React.ReactNode;
    /** rendered when the user lacks permissions */
    fallback: React.ReactNode;
  }>;

export default function Authorized({
  resource,
  action,
  children,
  mode = 'all',
  loading = null,
  fallback = null,
}: AuthorizedProps) {
  const { can, canAll, canAny, isLoading } = usePermissions();

  if (isLoading) return <>{loading}</>;

  const actions = Array.isArray(action) ? action : [action];
  const perms = actions.map((a) => `${resource}:${a}` as const);

  const allowed =
    actions.length === 1
      ? can(resource, actions[0])
      : mode === 'all'
        ? canAll(perms)
        : canAny(perms);

  return <>{allowed ? children : fallback}</>;
}
