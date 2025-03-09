import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Initialize the driver
export const pool = new Pool({
  max: 1,
  ssl: false, // set to true when switching to Neon
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool, logger: true });
