import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { email } = USER_SCHEMA_VALIDATION;

export const ForgotPasswordSchema = z.object({
  email,
});

export const LoginSchema = z.object({
  email,
  password: z.string().min(8).max(128),
});

export type LoginValues = z.infer<typeof LoginSchema>;
export type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;
