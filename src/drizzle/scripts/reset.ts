import { sql } from 'drizzle-orm';
import * as readline from 'readline';

import db from '../index';

console.info(
  '🚩 Update `connectionString` in `src/drizzle/index.ts` to database URL before running this script.'
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askForConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(
      '⚠️  Are you sure you want to reset the database? This will delete all data. (Y/N): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      }
    );
  });
}

// Check for confirmation before proceeding
async function main() {
  const confirmed = await askForConfirmation();
  if (!confirmed) {
    console.log('❌ Database reset cancelled.');
    process.exit(0);
  }

  await reset();
}

main().catch((err) => {
  console.error('❌ Error occurred');
  console.error(err);
  process.exit(1);
});

async function reset() {
  console.log('⏳ Resetting database...');
  const start = Date.now();

  const query = sql`
  -- Delete all tables
  DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;

  -- Delete enums
  DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (select t.typname as enum_name
        from pg_type t 
          join pg_enum e on t.oid = e.enumtypid  
          join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        where n.nspname = current_schema()) LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.enum_name);
        END LOOP;
      END $$;
	`;

  await db.execute(query);

  const end = Date.now();
  console.log(`✅ Reset end & took ${end - start}ms`);

  process.exit(0);
}
