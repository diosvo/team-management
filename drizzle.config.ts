import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',

  schema: './src/schema.ts',
  out: './drizzle/migrations',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  casing: 'snake_case',
  verbose: true,
  strict: true,
});
