import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { name, email, roles } = USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  roles,
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
