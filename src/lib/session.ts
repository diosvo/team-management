'server-only';

import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { SignJWT, jwtVerify } from 'jose';

import { DEFAULT_LOGIN_REDIRECT, LOGIN_PATH } from '@/routes';
import logger from './logger';

type SessionPayload = {
  user_id: string;
  expires: Date;
};

const alg = process.env.SESSION_ALGOTITHM!;
const secretKey = process.env.SESSION_SECRET!;

const key = new TextEncoder().encode(secretKey);
export const COOKIE = {
  name: 'sgr-session',
  duration: 24 * 60 * 60 * 1000, // 1 day
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('1day')
    .sign(key);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: [alg],
    });
    return payload;
  } catch {
    logger.error('Failed to verify session');
  }
}

export async function createSession(user_id: string) {
  const expires = new Date(Date.now() + COOKIE.duration);
  const session = await encrypt({ user_id, expires });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE.name, session, {
    // Prevents client-side JS from accessing the cookie.
    httpOnly: true,
    // Use https to send the cookie.
    secure: true,
    // Specify whether the cookie can be sent with cross-site requests
    sameSite: 'lax',
    // Define the URL path for the cookie.
    path: '/',
    expires,
  });

  redirect(DEFAULT_LOGIN_REDIRECT);
}

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

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE.name);

  redirect(LOGIN_PATH);
}
