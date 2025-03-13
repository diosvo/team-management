import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',

  schema: './src/drizzle/schema.ts',
  out: './src/drizzle/migrations',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  casing: 'snake_case',
  verbose: true,
  strict: true,
});
