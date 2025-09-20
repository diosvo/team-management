/**
 * @description Typical steps for implementing a server action
 * 1. Create a server action function,
 * 2. Validate input data,
 * 3. Check user authentication,
 * 4. Perform database operation,
 * 5. Return success/error state within a message
 */

import { User } from '@/drizzle/schema';
import auth from '@/lib/auth';
import { LOGIN_PATH } from '@/routes';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getServerSession = cache(
  async () =>
    await auth.api.getSession({
      headers: await headers(),
    })
);

type ServerAction<T extends Array<unknown>, R> = (...args: T) => Promise<R>;

export function withAuth<T extends Array<unknown>, R>(
  serverAction: (user: User, ...args: T) => Promise<R>
): ServerAction<T, R> {
  return async (...args: T): Promise<R> => {
    const session = await getServerSession();

    if (!session || !session.user) {
      // Currently, it only works for GET method
      redirect(LOGIN_PATH);
    }

    return serverAction(session.user as User, ...args);
  };
}
