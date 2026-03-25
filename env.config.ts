import { loadEnvConfig } from '@next/env';
import { z } from 'zod';

const pwd = process.cwd();
loadEnvConfig(pwd);

// Set a default value to avoid building issues on Vercel
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CI: z.boolean().default(false),
  DEV_URL: z.url().default(''),
  PRODUCTION_URL: z.url().default(''),
  DATABASE_URL: z.string().default(''),
  RESEND_API_KEY: z.string().min(1).default(''),
  PW_USERNAME: z.string().min(1).default(''),
  PW_PASSWORD: z.string().min(1).default(''),
});
const env = envSchema.parse(process.env);

export default env;
