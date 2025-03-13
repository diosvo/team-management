import { NextResponse } from 'next/server';
import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  console.log('isLoggedIn', isLoggedIn);

  return NextResponse.next();
});

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
