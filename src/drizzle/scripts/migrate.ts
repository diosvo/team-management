import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { getDbErrorMessage } from '@/db/pg-error';
import db from '../index';

interface MigrationError extends Error {
  cause: {
    message: string;
    code: string;
  };
  query: string;
}

async function main() {
  console.log('🚀 Starting migration...\n');

  try {
    await migrate(db, {
      migrationsFolder: 'src/drizzle/migrations',
    });
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error: unknown) {
    console.error('❌ Migration failed!\n');

    const { cause, query } = error as MigrationError;

    if (cause && cause.code) {
      console.error('Code:', cause.code);
    }

    // Extract the most relevant information
    const { message } = getDbErrorMessage(error);
    console.error('Error:', message);

    // Show the failed query in a readable format
    if (query) {
      console.error('\nFailed SQL Query:');
      console.error('─────────────────');
      console.error(query.trim());
    }

    console.error('');
    process.exit(1);
  }
}

main();
