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
  CRON_SECRET: z.string().default(''),
  DEV_URL: z.url().default('http://localhost:3000'),
  PRODUCTION_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.string().default(''),
  DATABASE_POOL_MAX: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe(
      'Postgres pool size. Keep 1 on serverless; raise it (e.g. 10) on a long-running server.',
    ),
  RESEND_API_KEY: z.string().default(''),
  RESEND_WEBHOOK_SECRET: z
    .string()
    .default('')
    .describe(
      'Signing secret (whsec_...) of the Resend webhook endpoint. Required to record email delivery statuses.',
    ),
  UPLOAD_DIR: z
    .string()
    .default('uploads')
    .describe(
      'Directory for uploaded images and generated reports, relative to the app root. Mount it as a persistent volume in production.',
    ),
  RENDER_ORIGIN: z
    .url()
    .optional()
    .describe(
      "Origin the headless browser loads app pages from for PDF reports, e.g. http://127.0.0.1:3000 on the VPS. Skips the reverse proxy, whose country filter blocks the server's own public IP. Unset: the public request origin.",
    ),
  CHROMIUM_PACK_URL: z
    .string()
    .default('')
    .describe(
      'The URL to the Brotli pack of the Chromium executable. Required for production deployment.',
    ),
  CHROMIUM_PATH: z
    .string()
    .default('')
    .describe(
      'Path to a system Chromium binary, e.g. /usr/bin/chromium in the Docker image. When set, it is used instead of CHROMIUM_PACK_URL.',
    ),
  GITHUB_TOKEN: z
    .string()
    .default('')
    .describe(
      'Token with Issues read/write access on the feedback repository. Required to send in-app feedback for reporters without a GitHub account.',
    ),
  GOOGLE_CLIENT_ID: z
    .string()
    .default('')
    .describe(
      'OAuth web client ID from Google Cloud with the Drive and Sheets APIs enabled and <origin>/google-callback as an authorized redirect URI. Enables opening the jersey form in Google Sheets.',
    ),
  PW_USERNAME: z.string().default(''),
  PW_PASSWORD: z.string().default(''),
});
const env = envSchema.parse(process.env);

export default env;
