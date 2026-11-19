import '@env';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

const ROOT = path.join(__dirname, '../..');

/**
 * Rebuilds the e2e database before every run: drop everything, apply all
 * migrations, then load `seed_data.sql`. Specs can then rely on the seeded
 * rows (accounts, players, sessions, matches...) and create/edit/delete freely
 * without touching the developer's own database.
 */
export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. e2e tests need their own database; add it to .env.',
    );
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL must differ from DATABASE_URL: e2e tests wipe it.',
    );
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query(`
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
    `);
    await migrate(drizzle(client), {
      migrationsFolder: path.join(ROOT, 'src/drizzle/migrations'),
    });
    await client.query(
      readFileSync(path.join(ROOT, 'src/drizzle/sql/seed_data.sql'), 'utf8'),
    );
  } finally {
    await client.end();
  }
}
