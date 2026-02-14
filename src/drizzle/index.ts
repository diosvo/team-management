import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import env from '@/schemas/env';
import * as schema from './schema';

// Initialize the driver
const pool = new Pool({
  max: 1,
  connectionString: env.DATABASE_URL,
});

const db = drizzle({
  schema,
  client: pool,
});

export default db;
