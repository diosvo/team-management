import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/db/migrations',
  dialect: 'postgresql',
  schema: './src/db/schema',

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  casing: 'snake_case',
  verbose: true,
  strict: true,
});
