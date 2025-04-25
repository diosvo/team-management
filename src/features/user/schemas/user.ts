import { z } from 'zod';

import { USER_SCHEMA_VALIDATION } from './utils';

const { name, dob, email, roles, state, join_date } = USER_SCHEMA_VALIDATION;

export const AddUserSchema = z.object({
  name,
  email,
  dob,
  roles,
  state,
  join_date,
});

export const UpdateUserSchema = z.object({
  dob,
});

export type AddUserValues = z.infer<typeof AddUserSchema>;
export type UpdateUserValues = z.infer<typeof UpdateUserSchema>;
