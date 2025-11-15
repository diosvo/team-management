import { z } from 'zod';

// Set a default value to avoid building issues on Vercel
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  ANALYZE_BUILD: z.boolean().default(false),
  DEV_URL: z.url().default('localhost:3000'),
  PRODUCTION_URL: z.url().default('saigon-rovers'),
  DATABASE_URL: z.string().default(''),
  RESEND_API_KEY: z.string().min(1),
});
const env = envSchema.parse(process.env);

export default env;
