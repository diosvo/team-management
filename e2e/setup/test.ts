import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/** A random private address; the server's rate limiter outlives a run. */
const randomIp = () =>
  `10.${Array.from({ length: 3 }, () => Math.floor(Math.random() * 254) + 1).join('.')}`;

/**
 * Sign-in routes allow 3 attempts a minute per client IP, which better-auth
 * reads from `x-forwarded-for`. Every test gets its own address, so specs that
 * sign in (setup, login, sign-out) never throttle one another, even against a
 * server reused from an earlier run.
 */
export const test = base.extend({
  extraHTTPHeaders: async ({}, use) => {
    await use({ 'x-forwarded-for': randomIp() });
  },
});
