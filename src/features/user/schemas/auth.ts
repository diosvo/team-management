import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { password, email } = USER_SCHEMA_VALIDATION;

// Schema definitions
export const PasswordSchema = z.object({ password });
export const LoginSchema = z.object({
  email,
  password: z.string().default(''),
  // -- password is not required when requesting a reset password
});

// Types
export type PasswordValue = z.infer<typeof PasswordSchema>;
export type LoginValues = z.infer<typeof LoginSchema>;
