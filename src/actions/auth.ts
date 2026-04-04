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

import { User } from '@/drizzle/schema';
import auth from '@/lib/auth';
import { LOGIN_PATH } from '@/routes';

import { UserRole } from '@/utils/enum';
import {
  defineAbility,
  Permission,
  type Action,
  type Resource,
} from '@/utils/permissions';

export const getServerSession = cache(
  async () =>
    await auth.api.getSession({
      headers: await headers(),
    }),
);

type ServerAction<T extends Array<unknown>, R> = (...args: T) => Promise<R>;

export function withAuth<T extends Array<unknown>, R>(
  serverAction: (user: User, ...args: T) => Promise<R>,
): ServerAction<T, R> {
  return async (...args: T): Promise<R> => {
    const session = await getServerSession();

    if (!session || !session.user) {
      // Currently, it only works for fetching data
      redirect(LOGIN_PATH, RedirectType.replace);
    }

    return serverAction(session.user as User, ...args);
  };
}

export function withPermission<T extends Array<unknown>, R>(
  resource: Resource,
  actions: Array<Action>,
  serverAction: (user: User, ...args: T) => Promise<R>,
): ServerAction<T, R> {
  return withAuth(async (user, ...args: T) => {
    const ability = defineAbility(user.role as UserRole, user.is_captain);
    const hasPermission = ability.canAny(
      actions.map((action) => `${resource}:${action}` as Permission),
    );

    return hasPermission ? serverAction(user, ...args) : forbidden();
  });
}

/**
 * Usage:
 * ```js
 *   const roster = withResource('roster');
 *   export const addUser = roster(['create'], async (user, values) => { ... });
 *   export const removeUser = roster(['delete'], async (user, id) => { ... });
 * ```
 */
export function withResource(resource: Resource) {
  return <T extends Array<unknown>, R>(
    actions: Array<Action>,
    serverAction: (user: User, ...args: T) => Promise<R>,
  ): ServerAction<T, R> => withPermission(resource, actions, serverAction);
}
