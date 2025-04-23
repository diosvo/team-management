import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { name, dob, email, roles } = USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  roles,
});

export const UpdateUserSchema = z.object({
  dob,
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type UpdateUserValues = z.infer<typeof UpdateUserSchema>;
