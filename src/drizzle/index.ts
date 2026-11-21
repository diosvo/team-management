import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import env from '@env';

import * as schema from './schema';

// Initialize the driver
const pool = new Pool({
  max: env.DATABASE_POOL_MAX,
  connectionString: env.DATABASE_URL,
});

const db = drizzle({
  schema,
  client: pool,
});

export default db;
