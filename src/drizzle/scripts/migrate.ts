import { migrate } from 'drizzle-orm/node-postgres/migrator';

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

    const { cause, message, query } = error as MigrationError;

    // Extract the most relevant information
    if (cause) {
      console.error('Error:', cause.message);
      if (cause.code) {
        console.error('Code:', cause.code);
      }
    } else if (message) {
      console.error('Error:', message);
    }

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
