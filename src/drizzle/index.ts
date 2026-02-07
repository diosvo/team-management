import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

// Initialize the driver
const pool = new Pool({
  max: 1,
  connectionString: 'postgresql://diosvo:@localhost:5432/saigon-rovers',
});

const db = drizzle({
  schema,
  client: pool,
});

export default db;
