import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  ANALYZE_BUILD: z.boolean().default(false),
  DEV_URL: z.url(),
  PRODUCTION_URL: z.url(),
  DATABASE_URL: z.url(),
  RESEND_API_KEY: z.string().min(1),
});
const env = envSchema.parse(process.env);

export default env;
