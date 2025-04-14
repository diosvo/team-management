import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { password, email } = USER_SCHEMA_VALIDATION;

// Schema definitions
export const EmailSchema = z.object({ email });
export const PasswordSchema = z.object({ password });
export const LoginSchema = z.object({
  email,
  password: z.string(), // password
});

// Types
export type EmailValue = z.infer<typeof EmailSchema>;
export type PasswordValue = z.infer<typeof PasswordSchema>;
export type LoginValues = z.infer<typeof LoginSchema>;
export type AuthValues = EmailValue | LoginValues;
