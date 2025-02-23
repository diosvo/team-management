import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Initialize the driver
const pool = new Pool({
  ssl: false, // set to true when switching to Neon
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle({ client: pool, logger: true });

export { db };
