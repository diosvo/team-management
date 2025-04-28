import 'server-only';

import { cookies } from 'next/headers';
import { cache } from 'react';

import { EXPIRES_AT } from '@/utils/constant';
import { SignJWT, jwtVerify } from 'jose';

type SessionData = {
  user_id: string;
  expires: Date;
};

const alg = process.env.SESSION_ALGOTITHM!;
const secretKey = process.env.SESSION_SECRET!;

const key = new TextEncoder().encode(secretKey);
export const COOKIE = {
  name: 'sgr-session',
};

async function encrypt(payload: SessionData) {
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
    return payload as SessionData;
  } catch {
    return null;
  }
}

export async function createSession(user_id: string) {
  const expires = EXPIRES_AT;
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

  if (!session) return null;

  const user_id = session.user_id;
  const expired = session.expires < new Date();

  if (!user_id || expired) return null;

  return session as SessionData;
});

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE.name);
}
