import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { SignJWT, jwtVerify } from 'jose';

import logger from './logger';

type SessionData = {
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

async function encrypt(payload: SessionData) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('1day')
    .sign(key);
}

async function decrypt(session: string | undefined = '') {
  const { payload } = await jwtVerify(session, key, {
    algorithms: [alg],
  });
  return payload as SessionData;
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
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.name)?.value;
  const session = await decrypt(token);

  if (!session) {
    return null;
  }

  const user_id = session.user_id;
  const expired = session.expires < new Date();

  // Logout if session has been expired
  if (!user_id || expired) {
    logger.warn('Session is invalid or expired.');
    return null;
  }

  return session as SessionData;
});

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE.name);
}
