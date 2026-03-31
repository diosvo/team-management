import { loadEnvConfig } from '@next/env';
import { z } from 'zod';

const pwd = process.cwd();
loadEnvConfig(pwd);

// Set a default value to avoid building issues on Vercel
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CI: z.coerce.boolean().default(false),
  DEV_URL: z.url().default('http://localhost:3000'),
  PRODUCTION_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  PW_USERNAME: z.string().default(''),
  PW_PASSWORD: z.string().default(''),
});
const env = envSchema.parse(process.env);

export default env;
