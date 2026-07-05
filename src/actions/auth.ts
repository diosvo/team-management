/**
 * @description Typical steps for implementing a server action
 * 1. Create a server action function,
 * 2. Validate input data,
 * 3. Check user authentication,
 * 4. Perform database operation,
 * 5. Return success/error state within a message
 */

import { headers } from 'next/headers';
import { forbidden, redirect, RedirectType } from 'next/navigation';
import { cache } from 'react';

import type { User } from '@/drizzle/schema/user';
import auth from '@/lib/auth';
import { LOGIN_PATH } from '@/routes';

import { UserRole } from '@/utils/enum';
import {
  defineAbility,
  type Action,
  type Permission,
  type Resource,
} from '@/utils/permissions';

type ServerAction<T extends Array<unknown>, R> = (...args: T) => Promise<R>;

/**
 * Request-scoped session lookup.
 */
export const verifySession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) return null;

  return session;
});

export function withAuth<T extends Array<unknown>, R>(
  serverAction: (user: User, ...args: T) => Promise<R>,
): ServerAction<T, R> {
  return async (...args: T): Promise<R> => {
    const session = await verifySession();

    if (!session) {
      redirect(LOGIN_PATH, RedirectType.replace);
    }

    return serverAction(session.user as User, ...args);
  };
}

/**
 * Usage:
 * ```ts
 * 'use server';
 * const roster = withResource('roster');
 *
 * export const upsertPlayer = roster(['create', 'edit'], async (user, data) => {
 *   // action logic - `user` is guaranteed authenticated & authorized
 * });
 *
 * // single action shorthand
 * export const listPlayers = roster('view', async (user) => { ... });
 * ```
 */
export function withResource(resource: Resource) {
  return <T extends Array<unknown>, R>(
    actions: Action | Array<Action>,
    serverAction: (user: User, ...args: T) => Promise<R>,
  ): ServerAction<T, R> => {
    const required = (Array.isArray(actions) ? actions : [actions]).map(
      (action) => `${resource}:${action}` as Permission,
    );

    return withAuth(async (user, ...args: T) => {
      const ability = defineAbility(
        user.role as UserRole,
        user.is_captain ?? false,
      );

      if (!ability.canAll(required)) forbidden();

      return serverAction(user, ...args);
    });
  };
}
