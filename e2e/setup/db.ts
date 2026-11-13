import '@env';

import { randomBytes } from 'crypto';
import { Client } from 'pg';

/** Run `fn` against the e2e database (never the developer's own). */
async function withTestDb<T>(fn: (client: Client) => Promise<T>) {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set');

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Stores a password-reset token for `userId` the way better-auth does when it
 * emails a reset link, so a spec can walk `/new-password?token=...` without a
 * mailbox.
 */
export async function createResetToken(userId: string) {
  const token = randomBytes(18).toString('hex');

  await withTestDb((client) =>
    client.query(
      `INSERT INTO verification (id, identifier, value, expires_at)
       VALUES ($1, $2, $3, now() + interval '1 hour')`,
      [`e2e-${token}`, `reset-password:${token}`, userId],
    ),
  );

  return token;
}

/** ISO day of the latest completed training session (seeded with attendance). */
export async function latestCompletedSessionDay() {
  const { rows } = await withTestDb((client) =>
    client.query<{ day: string }>(
      `SELECT to_char(max(date), 'YYYY-MM-DD') AS day
       FROM training_session WHERE status = 'completed'`,
    ),
  );
  return rows[0]!.day;
}
