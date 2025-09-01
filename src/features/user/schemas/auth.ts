import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { email } = USER_SCHEMA_VALIDATION;

// Schema definitions
export const LoginSchema = z.object({
  email,
  password: z.string().default(''),
  // -- password is not required when requesting a reset password
});

// Types
export type LoginValues = z.infer<typeof LoginSchema>;
