import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { User } from '@/drizzle/schema';
import { getUserById } from '@/features/user/db/auth';
import { LOGIN_PATH } from '@/routes';

import { COOKIE, decrypt } from './session';

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.name)?.value;
  const session = await decrypt(token);

  const user_id = String(session?.user_id);

  if (!user_id) {
    redirect(LOGIN_PATH);
  }

  return { user_id };
});

export const getUser = cache(async () => {
  // Verify user's session
  const session = await verifySession();
  if (!session) return null;

  // Get user from database
  const user = await getUserById(session?.user_id);

  if (!user) return null;

  return useDTO(user);
});

function useDTO(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: user.roles,
    state: user.state,
  };
}
